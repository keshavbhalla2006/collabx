const { nanoid } = require('nanoid'); //nanoid → generates a unique short ID (used as invite code)
const { Room, RoomMember, User } = require('../models');
//Room → table storing room details, RoomMember → junction table (users ↔ rooms), User → users table



// POST /api/rooms/create
const createRoom = async (req, res) => {
  try {
    const { name, language } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required.' });
    }

    // Generate a unique 8-character invite code
    const invite_code = nanoid(8);

    // Create the room — host is the logged-in user
    const room = await Room.create({
      name,
      language: language || 'javascript',
      invite_code,
      host_id: req.user.id,
      current_code: '',
      is_active: true,
    });

    // Add the creator as a member with role 'host'
    await RoomMember.create({
      room_id: room.id,
      user_id: req.user.id,
      role: 'host',
    });

    res.status(201).json({
      message: 'Room created successfully.',
      room,
    });

  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Server error creating room.' });
  }
};

// POST /api/rooms/join
const joinRoom = async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ message: 'Invite code is required.' });
    }

    // Find the room by invite code
    const room = await Room.findOne({ where: { invite_code, is_active: true } });
    if (!room) {
      return res.status(404).json({ message: 'Room not found or no longer active.' });
    }

    // Check if user is already a member
    const existing = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });

    if (!existing) {
      await RoomMember.create({
        room_id: room.id,
        user_id: req.user.id,
        role: 'member',
      });
    }

    res.json({ message: 'Joined room successfully.', room });

  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ message: 'Server error joining room.' });
  }
};

// GET /api/rooms/my-rooms — get all rooms the user is part of
const getMyRooms = async (req, res) => {
  try {
    // Find all RoomMember records for this user, include the Room details
    const memberships = await RoomMember.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Room,
          where: { is_active: true },
          include: [
            {
              model: User,
              as: 'host',
              attributes: ['id', 'name', 'avatar_url'], // only send safe fields
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']], // newest first
    });

    // Extract just the Room objects from each membership
    const rooms = memberships.map((m) => ({
      ...m.Room.toJSON(),
      role: m.role, // 'host' or 'member'
    }));

    res.json({ rooms });

  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Server error fetching rooms.' });
  }
};

// GET /api/rooms/:id — get a single room by ID
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [
        { model: User, as: 'host', attributes: ['id', 'name', 'avatar_url'] },
      ],
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    // Security: only members can view this room
    const isMember = await RoomMember.findOne({
      where: { room_id: room.id, user_id: req.user.id },
    });

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this room.' });
    }

    res.json({ room });

  } catch (err) {
    console.error('Get room error:', err);
    res.status(500).json({ message: 'Server error fetching room.' });
  }
};

// PATCH /api/rooms/:id/close — host can close a room
const closeRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);

    if (!room) return res.status(404).json({ message: 'Room not found.' });

    // Only the host can close it
    if (room.host_id !== req.user.id) {
      return res.status(403).json({ message: 'Only the host can close this room.' });
    }

    room.is_active = false;
    await room.save();

    res.json({ message: 'Room closed.' });

  } catch (err) {
    console.error('Close room error:', err);
    res.status(500).json({ message: 'Server error closing room.' });
  }
};

module.exports = { createRoom, joinRoom, getMyRooms, getRoomById, closeRoom };

//This is a controller file that handles backend logic for "coding" room.
/*
Proper HTTP status codes:

400 → bad request
403 → forbidden
404 → not found
500 → server error
*/