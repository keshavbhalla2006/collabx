import { useEffect, useRef, useState } from 'react';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff,
  FiPhoneOff, FiPhone
} from 'react-icons/fi';
import ChatPanel from './ChatPanel';

// ── Video Tile ───────────────────────────────────────────────
function VideoTile({ stream, name, muted = false, cameraOn = true }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => { });
    }
  }, [stream]);

  return (
    <div style={s.tile}>
      {stream && cameraOn ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} style={s.video} />
      ) : (
        <div style={s.noCamera}>
          <div style={s.avatar}>{name?.[0]?.toUpperCase() || '?'}</div>
        </div>
      )}
      <div style={s.nameTag}>{name}{muted ? ' (You)' : ''}</div>
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────
export default function VideoPanel({
  localStream,
  remoteStreams,
  callActive,
  micOn,
  cameraOn,
  error,
  onStartCall,
  onEndCall,
  onToggleMic,
  onToggleCamera,
  userName,
  socket,
  roomId,
  user,
}) {
  const [activeTab, setActiveTab] = useState('video');
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Unread message tracking ───────────────────────────────
  // useEffect(() => {
  //   if (!socket) return;

  //   const handleMsg = () => {
  //     if (activeTab !== 'chat') {
  //       setUnreadCount((n) => n + 1);
  //     }
  //   };

  //   socket.on('chat-message', handleMsg);
  //   return () => socket.off('chat-message', handleMsg);
  // }, [socket, activeTab]);
  useEffect(() => {
    if (!socket) return;

    const handleMsg = (msg) => {
      // Only increment badge if chat tab is not active
      if (activeTab !== 'chat') {
        setUnreadCount((n) => n + 1);
      }
    };

    socket.on('chat-message', handleMsg);
    return () => {
      socket.off('chat-message', handleMsg);
    };
  }, [socket, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') setUnreadCount(0);
  };

  return (
    <div style={s.panel}>

      {/* ── Tabs ── */}
      <div style={s.tabBar}>
        <button
          style={{
            ...s.tab,
            borderBottom: activeTab === 'video' ? '2px solid #a78bfa' : '2px solid transparent'
          }}
          onClick={() => handleTabChange('video')}
        >
          Video
          {callActive && <span style={s.live}> ●</span>}
        </button>

        <button
          style={{
            ...s.tab,
            borderBottom: activeTab === 'chat' ? '2px solid #a78bfa' : '2px solid transparent'
          }}
          onClick={() => handleTabChange('chat')}
        >
          Chat
          {unreadCount > 0 && <span style={s.badge}>{unreadCount}</span>}
        </button>
      </div>

      {/* ── VIDEO TAB ── */}
      {activeTab === 'video' && (
        <>
          {error && <div style={s.error}>{error}</div>}

          <div style={s.videoGrid}>
            {callActive ? (
              <>
                <VideoTile
                  stream={localStream}
                  name={userName}
                  muted={true}
                  cameraOn={cameraOn}
                />

                {Object.entries(remoteStreams).map(([id, { stream, name }]) => (
                  <VideoTile
                    key={id}
                    stream={stream}
                    name={name}
                    muted={false}
                    cameraOn={true}
                  />
                ))}
              </>
            ) : (
              <div style={s.placeholder}>
                <p style={s.placeholderText}>
                  Start a call to enable video and audio
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={s.controls}>
            {!callActive ? (
              <button style={s.startBtn} onClick={onStartCall}>
                <FiPhone size={16} />
                <span>Start</span>
              </button>
            ) : (
              <>
                <button
                  style={{ ...s.controlBtn, background: micOn ? '#374151' : '#dc2626' }}
                  onClick={onToggleMic}
                >
                  {micOn ? <FiMic size={16} /> : <FiMicOff size={16} />}
                </button>

                <button
                  style={{ ...s.controlBtn, background: cameraOn ? '#374151' : '#dc2626' }}
                  onClick={onToggleCamera}
                >
                  {cameraOn ? <FiVideo size={16} /> : <FiVideoOff size={16} />}
                </button>

                <button
                  style={{ ...s.controlBtn, background: '#dc2626' }}
                  onClick={onEndCall}
                >
                  <FiPhoneOff size={16} />
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* ── CHAT TAB ── */}
      {activeTab === 'chat' && (
  <ChatPanel socket={socket} roomId={roomId} user={user} />
)}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────
const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    background: '#1a1a2e',
    borderLeft: '1px solid #333',
    width: '240px',
  },
  tabBar: {
    display: 'flex',
    background: '#13131f',
  },
  tab: {
    flex: 1,
    padding: '0.5rem',
    color: '#9ca3af',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    position: 'relative',
  },
  live: { color: '#4ade80' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 6,
    background: '#dc2626',
    color: '#fff',
    fontSize: '0.6rem',
    padding: '0 5px',
    borderRadius: '10px',
  },
  videoGrid: {
    flex: 1,
    padding: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  tile: {
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#0f0f1a',
    aspectRatio: '4/3',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  noCamera: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#6c63ff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontWeight: '700',
  },
  nameTag: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    color: '#fff',
    fontSize: '0.7rem',
    background: 'rgba(0,0,0,0.5)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.6rem',
    background: '#13131f',
  },
  startBtn: {
    background: '#6c63ff',
    color: '#fff',
    border: 'none',
    padding: '0.4rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  placeholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  placeholderText: {
    color: '#4b5563',
    fontSize: '0.8rem',
  },
  error: {
    background: '#450a0a',
    color: '#f87171',
    padding: '0.5rem',
    fontSize: '0.75rem',
  },
};
