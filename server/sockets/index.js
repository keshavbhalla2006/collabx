const { Room, Version, Message } = require('../models');
const jwt = require('jsonwebtoken');

const initSocket = (io) => {

  const roomMembers = new Map();
  // In-memory map: roomId → Set of { socketId, userId, name }
  // This lives as long as the server runs


  // Middleware — authenticate socket connection using JWT
  // This runs before any socket event, just like protect middleware for HTTP
  io.use((socket, next) => { //When a client connects, it must send a JWT token
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error: no token'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);//verifies the token
      socket.user = decoded; // attach user info to socket
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.name} (${socket.id})`);

    //  -------------------ROOM JOIN------------------------
    // Called when a user opens a room page
    socket.on('join-room', async ({ roomId }) => {
      // Socket.IO "rooms" are just named channels
      // Calling join() subscribes this socket to all events in that channel
      socket.join(`room:${roomId}`);

      // Add this user to the in-memory room members map
      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Map());
      }
      roomMembers.get(roomId).set(socket.id, {
        socketId: socket.id,
        userId: socket.user.id,
        name: socket.user.name,
      });

      // Tell everyone else in the room that this user joined
      socket.to(`room:${roomId}`).emit('user-joined', {
        userId: socket.user.id,
        name: socket.user.name,
      });

      // Send the current code state to the newly joined user
      try {
        const room = await Room.findByPk(roomId);
        if (room) {
          // Only send to this socket (not broadcast)
          socket.emit('room-state', {
            code: room.current_code,
            language: room.language,
          });
        }
      } catch (err) {
        console.error('join-room error:', err);
      }
      const members = Array.from(roomMembers.get(roomId).values()).map(m => ({
        userId: m.userId,
        name: m.name,
      }));
      socket.emit('current-members', { members });
    });

    // -----------------------COLLAB FEATURES---------------------------
    //  code-change
    // Fired every time someone types in the editor
    socket.on('code-change', async ({ roomId, code }) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(`room:${roomId}`).emit('code-update', { code });

      // Persist the latest code to the database
      // We update current_code so new joiners always get the latest state
      try {
        await Room.update(
          { current_code: code },
          { where: { id: roomId } }
        );
      } catch (err) {
        console.error('code-change DB error:', err);
      }
    });

    //  language-change 
    // Fired when the host changes the coding language
    socket.on('language-change', async ({ roomId, language }) => {
      socket.to(`room:${roomId}`).emit('language-update', { language });

      try {
        await Room.update({ language }, { where: { id: roomId } });
      } catch (err) {
        console.error('language-change DB error:', err);
      }
    });

    //  save-version 
    // Manually save a code snapshot (like git commit)
    socket.on('save-version', async ({ roomId, code, language }) => {
      try {
        const version = await Version.create({
          room_id: roomId,
          saved_by: socket.user.id,
          code_snapshot: code,
          language,
        });

        // Notify everyone in the room that a version was saved
        io.to(`room:${roomId}`).emit('version-saved', {
          versionId: version.id,
          savedBy: socket.user.name,
          savedAt: version.createdAt,
        });
      } catch (err) {
        console.error('save-version error:', err);
      }
    });

    //  execution-result
    // When backend sends result back, broadcast to everyone in the room
    socket.on('execution-result', ({ roomId, result }) => {
      // io.to includes the sender — everyone sees the output simultaneously
      io.to(`room:${roomId}`).emit('execution-output', result);
    });

    //----------------------------AI QUESTION SYNC------------------------
    // When host loads a question, broadcast it to all room members
    // so both the interviewer and candidate see the same question
    socket.on('question-loaded', async ({ roomId, question }) => {
      try {
        // Save question JSON to the room record
        await Room.update(
          { current_question: JSON.stringify(question) },
          { where: { id: roomId } }
        );
      } catch (err) {
        console.error('Error saving question:', err);
      }
      // Send to everyone INCLUDING the host (io.to not socket.to)
      // so the question panel renders for all users simultaneously
      io.to(`room:${roomId}`).emit('question-update', { question });
    });


    //----------------------------WEBRTC SIGNALLING------------------------

    // These three events are the complete WebRTC handshake
    // The server is just a post office — it forwards messages between peers

    // Person A sends their offer to Person B
    socket.on('webrtc-offer', ({ roomId, offer, targetSocketId }) => {
      // Forward offer to the specific target peer
      io.to(targetSocketId).emit('webrtc-offer', {
        offer,
        fromSocketId: socket.id,
        fromName: socket.user.name,
      });
    });

    // Person B sends their answer back to Person A
    socket.on('webrtc-answer', ({ answer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc-answer', {
        answer,
        fromSocketId: socket.id,
      });
    });

    // Both sides exchange ICE candidates
    // ICE = Interactive Connectivity Establishment
    // These are network path options (IP addresses, ports) each peer can be reached at
    socket.on('webrtc-ice-candidate', ({ candidate, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // When a user is ready to receive calls (camera/mic turned on)
    socket.on('webrtc-ready', ({ roomId }) => {
      // Forward socket.id and name so the receiver knows WHO to connect to
      socket.to(`room:${roomId}`).emit('webrtc-user-ready', {
        socketId: socket.id,
        name: socket.user.name,
      });
    });

    // When a user ends the call
    socket.on('webrtc-leave-call', ({ roomId }) => {
      socket.to(`room:${roomId}`).emit('webrtc-user-left-call', {
        socketId: socket.id,
        name: socket.user.name,
      });
    });


    // ── Chat ───────────────────────────────────────────────────
    socket.on('chat-message', async ({ roomId, message }) => {
      if (!message?.trim()) return;

      try {
        // Save to database
        await Message.create({
          room_id: roomId,
          sender_id: socket.user.id,
          content: message.trim(),
        });
      } catch (err) {
        console.error('Error saving message:', err);
      }

      // Broadcast to everyone in the room INCLUDING sender
      io.to(`room:${roomId}`).emit('chat-message', {
        senderId: socket.user.id,
        senderName: socket.user.name,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      });
    });

    // ---------------------------DISCONNECTING----------------------
    //  disconnect 
    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          // Extract roomId from the room string 'room:42' → '42'
          const roomId = room.replace('room:', '');

          // Remove from in-memory map
          if (roomMembers.has(roomId)) {
            roomMembers.get(roomId).delete(socket.id);
            if (roomMembers.get(roomId).size === 0) {
              roomMembers.delete(roomId);
            }
          }

          socket.to(room).emit('user-left', {
            userId: socket.user.id,
            name: socket.user.name,
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { initSocket };


/*
The key insight: socket.emit() sends to everyone including the sender. 
socket.to(roomId).emit() sends to everyone in the room EXCEPT the sender. 
We always use the second one for code sync — otherwise Person A's own typing gets sent back to them, causing a loop.


socket.emit(): Sends to self + others (if targeted)

socket.to(room).emit(): Sends to everyone EXCEPT sender

io.to(room).emit(): Sends to everyone INCLUDING sender
*/