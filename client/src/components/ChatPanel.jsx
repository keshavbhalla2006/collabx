import { useState, useEffect, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import { roomAPI } from '../services/api';

const CHAT_STYLES = `
  .cp-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #090c11;
    font-family: 'Syne', sans-serif;
  }

  .cp-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.55rem 0.85rem;
    background: rgba(8,11,15,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .cp-title {
    color: #d4af37;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .cp-count {
    color: #2e3540;
    font-size: 0.67rem;
    font-family: 'Space Mono', monospace;
  }

  .cp-messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .cp-empty {
    color: #2e3540;
    font-size: 0.78rem;
    text-align: center;
    margin-top: 2.5rem;
    line-height: 1.8;
    letter-spacing: 0.03em;
  }

  .cp-msg-row {
    display: flex;
    align-items: flex-end;
    gap: 0.45rem;
  }

  .cp-avatar {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #141a24, #1e2535);
    border: 1.5px solid rgba(212,175,55,0.25);
    color: #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
    flex-shrink: 0;
    letter-spacing: 0;
  }

  .cp-avatar.self {
    background: linear-gradient(135deg, #1a1f2e, #252d40);
    border-color: rgba(212,175,55,0.4);
  }

  .cp-sender-name {
    color: #3a4250;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin: 0 0 0.2rem 0.2rem;
  }

  .cp-bubble {
    padding: 0.5rem 0.75rem;
    border-radius: 10px;
    max-width: 100%;
  }

  .cp-bubble.them {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-bottom-left-radius: 3px;
  }

  .cp-bubble.me {
    background: linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.07));
    border: 1px solid rgba(212,175,55,0.2);
    border-bottom-right-radius: 3px;
  }

  .cp-msg-text {
    color: #c8cdd4;
    font-size: 0.8rem;
    margin: 0;
    line-height: 1.55;
    word-break: break-word;
    white-space: pre-wrap;
    font-family: 'Syne', sans-serif;
  }

  .cp-time {
    color: #232b36;
    font-size: 0.62rem;
    margin: 0.15rem 0.2rem 0;
    font-family: 'Space Mono', monospace;
  }

  /* Input */
  .cp-input-row {
    display: flex;
    align-items: flex-end;
    gap: 0.45rem;
    padding: 0.65rem;
    border-top: 1px solid rgba(255,255,255,0.05);
    background: rgba(8,11,15,0.6);
    flex-shrink: 0;
  }

  .cp-textarea {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 8px;
    color: #c8cdd4;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    font-family: 'Syne', sans-serif;
    resize: none;
    outline: none;
    line-height: 1.5;
    max-height: 80px;
    overflow-y: auto;
    transition: border-color 0.2s;
  }

  .cp-textarea::placeholder { color: #2e3540; }

  .cp-textarea:focus {
    border-color: rgba(212,175,55,0.3);
    background: rgba(255,255,255,0.05);
  }

  .cp-send-btn {
    width: 36px; height: 36px;
    border-radius: 8px;
    background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.08));
    border: 1px solid rgba(212,175,55,0.35);
    color: #d4af37;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .cp-send-btn:hover:not(:disabled) {
    background: rgba(212,175,55,0.22);
    border-color: rgba(212,175,55,0.6);
    box-shadow: 0 0 12px rgba(212,175,55,0.15);
  }

  .cp-send-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
`;

export default function ChatPanel({ socket, roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!roomId || loadedRef.current) return;
    loadedRef.current = true;
    const load = async () => {
      try {
        const res = await roomAPI.getMessages(roomId);
        if (res.data.messages) setMessages(res.data.messages);
      } catch {}
    };
    load();
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;
    const handleMessage = (msg) => {
      setMessages((prev) => {
        const isDup = prev.some(m => m.timestamp === msg.timestamp && m.senderId === msg.senderId);
        return isDup ? prev : [...prev, msg];
      });
    };
    socket.on('chat-message', handleMessage);
    return () => socket.off('chat-message', handleMessage);
  }, [socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat-message', { roomId, message: input.trim() });
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  return (
    <>
      <style>{CHAT_STYLES}</style>
      <div className="cp-panel">
        <div className="cp-header">
          <span className="cp-title">Messages</span>
          <span className="cp-count">{messages.length}</span>
        </div>

        <div className="cp-messages">
          {messages.length === 0 && (
            <p className="cp-empty">No messages yet.<br />Start the conversation.</p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={i} className="cp-msg-row" style={{ justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <div className="cp-avatar">{msg.senderName?.[0]?.toUpperCase()}</div>}
                <div style={{ maxWidth: '82%' }}>
                  {!isMe && <p className="cp-sender-name">{msg.senderName}</p>}
                  <div className={`cp-bubble ${isMe ? 'me' : 'them'}`}>
                    <p className="cp-msg-text">{msg.message}</p>
                  </div>
                  <p className="cp-time" style={{ textAlign: isMe ? 'right' : 'left' }}>
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
                {isMe && <div className="cp-avatar self">{user?.name?.[0]?.toUpperCase()}</div>}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="cp-input-row">
          <textarea
            className="cp-textarea"
            placeholder="Message... (↵ to send)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            spellCheck={false}
          />
          <button
            className="cp-send-btn"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            <FiSend size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
