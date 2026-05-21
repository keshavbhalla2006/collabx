import { useState, useEffect, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import { roomAPI } from '../services/api';

export default function ChatPanel({ socket, roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const bottomRef               = useRef(null);
  const loadedRef               = useRef(false);

  // Load chat history once on mount
  useEffect(() => {
    if (!roomId || loadedRef.current) return;
    loadedRef.current = true;

    const loadHistory = async () => {
      try {
        const res = await roomAPI.getMessages(roomId);
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    loadHistory();
  }, [roomId]);

  // Socket listener — only one, never duplicated
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        const isDuplicate = prev.some(
          (m) => m.timestamp === msg.timestamp && m.senderId === msg.senderId
        );
        if (isDuplicate) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat-message', handleMessage);
    return () => socket.off('chat-message', handleMessage);
  }, [socket]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat-message', { roomId, message: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ''; }
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>Chat</span>
        <span style={s.count}>{messages.length} messages</span>
      </div>

      <div style={s.messages}>
        {messages.length === 0 && (
          <p style={s.empty}>No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={i} style={{ ...s.msgRow, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              {!isMe && (
                <div style={s.avatar}>
                  {msg.senderName?.[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ maxWidth: '75%' }}>
                {!isMe && <p style={s.senderName}>{msg.senderName}</p>}
                <div style={{
                  ...s.bubble,
                  background:   isMe ? '#6c63ff' : '#2d2d4e',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                }}>
                  <p style={s.msgText}>{msg.message}</p>
                </div>
                <p style={{ ...s.time, textAlign: isMe ? 'right' : 'left' }}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
              {isMe && (
                <div style={{ ...s.avatar, background: '#4c1d95' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={s.inputRow}>
        <textarea
          style={s.input}
          placeholder="Type a message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          spellCheck={false}
        />
        <button
          style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
          onClick={sendMessage}
          disabled={!input.trim()}
        >
          <FiSend size={16} />
        </button>
      </div>
    </div>
  );
}

const s = {
  panel:      { display: 'flex', flexDirection: 'column', height: '100%', background: '#13131f', fontFamily: 'sans-serif' },
  header:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#1a1a2e', borderBottom: '1px solid #2d2d4e', flexShrink: 0 },
  title:      { color: '#a78bfa', fontSize: '0.82rem', fontWeight: '600' },
  count:      { color: '#4b5563', fontSize: '0.72rem' },
  messages:   { flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  empty:      { color: '#4b5563', fontSize: '0.82rem', textAlign: 'center', marginTop: '2rem' },
  msgRow:     { display: 'flex', alignItems: 'flex-end', gap: '0.4rem' },
  avatar:     { width: 26, height: 26, borderRadius: '50%', background: '#374151', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '600', flexShrink: 0 },
  senderName: { color: '#9ca3af', fontSize: '0.7rem', margin: '0 0 0.2rem 0.2rem' },
  bubble:     { padding: '0.5rem 0.75rem' },
  msgText:    { color: '#f1f5f9', fontSize: '0.82rem', margin: 0, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' },
  time:       { color: '#4b5563', fontSize: '0.65rem', margin: '0.15rem 0.2rem 0' },
  inputRow:   { display: 'flex', alignItems: 'flex-end', gap: '0.4rem', padding: '0.6rem', borderTop: '1px solid #2d2d4e', background: '#1a1a2e', flexShrink: 0 },
  input:      { flex: 1, background: '#252540', border: '1px solid #374151', borderRadius: '8px', color: '#e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.82rem', resize: 'none', outline: 'none', fontFamily: 'sans-serif', lineHeight: 1.5, maxHeight: '80px', overflowY: 'auto' },
  sendBtn:    { width: 34, height: 34, borderRadius: '8px', background: '#6c63ff', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};



// import { useState, useEffect, useRef } from 'react';
// import { FiSend } from 'react-icons/fi';
// import { roomAPI } from '../services/api';

// export default function ChatPanel({
//   socket,
//   roomId,
//   user,
//   pendingMessages,
//   onMessagesRead,
// }) {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const bottomRef = useRef(null);

//   // Load chat history when component mounts
//   useEffect(() => {
//     if (!roomId) return;

//     const loadHistory = async () => {
//       try {
//         const res = await roomAPI.getMessages(roomId);
//         setMessages(res.data.messages);
//       } catch (err) {
//         console.error('Failed to load chat history:', err);
//       }
//     };

//     loadHistory();
//   }, [roomId]);

//   // // Listen for incoming real-time messages
//   // useEffect(() => {
//   //   if (!socket) return;

//   //   socket.on('chat-message', (msg) => {
//   //     setMessages((prev) => [...prev, msg]);
//   //   });

//   //   return () => socket.off('chat-message');
//   // }, [socket]);
//   // Merge pending messages coming from Room.jsx
//   useEffect(() => {
//     if (pendingMessages?.length > 0) {
//       setMessages((prev) => {
//         // Prevent duplicates
//         const existingTimestamps = new Set(
//           prev.map((m) => m.timestamp)
//         );

//         const newOnes = pendingMessages.filter(
//           (m) => !existingTimestamps.has(m.timestamp)
//         );

//         return [...prev, ...newOnes];
//       });

//       // Tell parent messages were consumed
//       onMessagesRead?.();
//     }
//   }, [pendingMessages, onMessagesRead]);

//   // Auto-scroll to latest message
//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const sendMessage = () => {
//     if (!input.trim()) return;

//     socket?.emit('chat-message', {
//       roomId,
//       message: input.trim(),
//     });

//     setInput('');
//   };

//   const handleKeyDown = (e) => {
//     // Send on Enter, new line on Shift+Enter
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       sendMessage();
//     }
//   };

//   const formatTime = (iso) => {
//     return new Date(iso).toLocaleTimeString([], {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   return (
//     <div style={s.panel}>
//       {/* Header */}
//       <div style={s.header}>
//         <span style={s.title}>Chat</span>
//         <span style={s.count}>{messages.length} messages</span>
//       </div>

//       {/* Messages */}
//       <div style={s.messages}>
//         {messages.length === 0 && (
//           <p style={s.empty}>
//             No messages yet. Say hello!
//           </p>
//         )}

//         {messages.map((msg, i) => {
//           const isMe = msg.senderId === user?.id;

//           return (
//             <div
//               key={i}
//               style={{
//                 ...s.msgRow,
//                 justifyContent: isMe ? 'flex-end' : 'flex-start',
//               }}
//             >
//               {/* Avatar for others */}
//               {!isMe && (
//                 <div style={s.avatar}>
//                   {msg.senderName?.[0]?.toUpperCase()}
//                 </div>
//               )}

//               <div style={{ maxWidth: '75%' }}>
//                 {/* Sender name */}
//                 {!isMe && (
//                   <p style={s.senderName}>{msg.senderName}</p>
//                 )}

//                 <div
//                   style={{
//                     ...s.bubble,
//                     background: isMe ? '#6c63ff' : '#2d2d4e',
//                     borderRadius: isMe
//                       ? '12px 12px 2px 12px'
//                       : '12px 12px 12px 2px',
//                   }}
//                 >
//                   <p style={s.msgText}>{msg.message}</p>
//                 </div>

//                 <p
//                   style={{
//                     ...s.time,
//                     textAlign: isMe ? 'right' : 'left',
//                   }}
//                 >
//                   {formatTime(msg.timestamp)}
//                 </p>
//               </div>

//               {/* Avatar for self */}
//               {isMe && (
//                 <div style={{ ...s.avatar, background: '#4c1d95' }}>
//                   {user?.name?.[0]?.toUpperCase()}
//                 </div>
//               )}
//             </div>
//           );
//         })}

//         <div ref={bottomRef} />
//       </div>

//       {/* Input */}
//       <div style={s.inputRow}>
//         <textarea
//           style={s.input}
//           placeholder="Type a message... (Enter to send)"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           onKeyDown={handleKeyDown}
//           rows={1}
//           spellCheck={false}
//         />

//         <button
//           style={{
//             ...s.sendBtn,
//             opacity: input.trim() ? 1 : 0.4,
//           }}
//           onClick={sendMessage}
//           disabled={!input.trim()}
//         >
//           <FiSend size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }

// const s = {
//   panel: {
//     display: 'flex',
//     flexDirection: 'column',
//     height: '100%',
//     background: '#13131f',
//     fontFamily: 'sans-serif',
//   },

//   header: {
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     padding: '0.5rem 0.75rem',
//     background: '#1a1a2e',
//     borderBottom: '1px solid #2d2d4e',
//     flexShrink: 0,
//   },

//   title: {
//     color: '#a78bfa',
//     fontSize: '0.82rem',
//     fontWeight: '600',
//   },

//   count: {
//     color: '#4b5563',
//     fontSize: '0.72rem',
//   },

//   messages: {
//     flex: 1,
//     overflowY: 'auto',
//     padding: '0.75rem',
//     display: 'flex',
//     flexDirection: 'column',
//     gap: '0.6rem',
//   },

//   empty: {
//     color: '#4b5563',
//     fontSize: '0.82rem',
//     textAlign: 'center',
//     marginTop: '2rem',
//   },

//   msgRow: {
//     display: 'flex',
//     alignItems: 'flex-end',
//     gap: '0.4rem',
//   },

//   avatar: {
//     width: 26,
//     height: 26,
//     borderRadius: '50%',
//     background: '#374151',
//     color: '#fff',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     fontSize: '0.7rem',
//     fontWeight: '600',
//     flexShrink: 0,
//   },

//   senderName: {
//     color: '#9ca3af',
//     fontSize: '0.7rem',
//     margin: '0 0 0.2rem 0.2rem',
//   },

//   bubble: {
//     padding: '0.5rem 0.75rem',
//   },

//   msgText: {
//     color: '#f1f5f9',
//     fontSize: '0.82rem',
//     margin: 0,
//     lineHeight: 1.5,
//     wordBreak: 'break-word',
//     whiteSpace: 'pre-wrap',
//   },

//   time: {
//     color: '#4b5563',
//     fontSize: '0.65rem',
//     margin: '0.15rem 0.2rem 0',
//   },

//   inputRow: {
//     display: 'flex',
//     alignItems: 'flex-end',
//     gap: '0.4rem',
//     padding: '0.6rem',
//     borderTop: '1px solid #2d2d4e',
//     background: '#1a1a2e',
//     flexShrink: 0,
//   },

//   input: {
//     flex: 1,
//     background: '#252540',
//     border: '1px solid #374151',
//     borderRadius: '8px',
//     color: '#e2e8f0',
//     padding: '0.5rem 0.75rem',
//     fontSize: '0.82rem',
//     resize: 'none',
//     outline: 'none',
//     fontFamily: 'sans-serif',
//     lineHeight: 1.5,
//     maxHeight: '80px',
//     overflowY: 'auto',
//   },

//   sendBtn: {
//     width: 34,
//     height: 34,
//     borderRadius: '8px',
//     background: '#6c63ff',
//     border: 'none',
//     color: '#fff',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexShrink: 0,
//   },
// };