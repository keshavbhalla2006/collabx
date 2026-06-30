import { useEffect, useRef, useState } from 'react';
import {
  FiMic, FiMicOff, FiVideo, FiVideoOff,
  FiPhoneOff, FiPhone, FiMessageSquare, FiMonitor
} from 'react-icons/fi';
import ChatPanel from './ChatPanel';

const PANEL_STYLES = `
  .vp-root {
    display: flex;
    flex-direction: column;
    background: #090c11;
    border-left: 1px solid rgba(212,175,55,0.12);
    width: 100%;
    height: 100%;
    flex-shrink: 0;
    font-family: 'Syne', sans-serif;
  }
  .vp-tabs {
    display: flex;
    background: rgba(8,11,15,0.95);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .vp-tab {
    flex: 1; padding: 0.65rem 0.5rem;
    color: #4a5260; background: transparent;
    border: none; border-bottom: 2px solid transparent;
    cursor: pointer; font-size: 0.72rem;
    font-family: 'Syne', sans-serif; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    position: relative; display: flex; align-items: center;
    justify-content: center; gap: 0.4rem; transition: all 0.2s;
  }
  .vp-tab:hover { color: #8a9199; }
  .vp-tab.active { color: #d4af37; border-bottom-color: #d4af37; background: rgba(212,175,55,0.04); }
  .vp-tab .live-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #4ade80; animation: livePulse 2s infinite; flex-shrink: 0;
  }
  @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .vp-badge {
    position: absolute; top: 4px; right: 8px;
    background: #dc2626; color: #fff; font-size: 0.58rem;
    padding: 1px 5px; border-radius: 10px; font-weight: 700;
    min-width: 16px; text-align: center;
  }
  .vp-video-area { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  .vp-grid {
    flex: 1; padding: 0.75rem; display: flex;
    flex-direction: column; gap: 0.6rem; overflow-y: auto;
  }
  .vp-tile {
    border-radius: 10px; overflow: hidden;
    background: #0e1218; border: 1px solid rgba(255,255,255,0.06);
    aspect-ratio: 4/3; position: relative; transition: border-color 0.2s;
  }
  .vp-tile:hover { border-color: rgba(212,175,55,0.2); }
  .vp-tile video { width:100%; height:100%; object-fit:cover; transform:scaleX(-1); display:block; }
  .vp-no-camera {
    display: flex; justify-content: center; align-items: center;
    height: 100%; background: linear-gradient(135deg,#0e1218,#141a24);
  }
  .vp-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg,#1a1f2e,#2a2f40);
    border: 2px solid rgba(212,175,55,0.3);
    display: flex; justify-content: center; align-items: center;
    color: #d4af37; font-weight: 800; font-size: 1.2rem;
  }
  .vp-name-tag {
    position: absolute; bottom: 8px; left: 8px;
    color: #e8ecf0; font-size: 0.68rem; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase;
    background: rgba(8,11,15,0.75); backdrop-filter: blur(6px);
    padding: 0.18rem 0.5rem; border-radius: 4px;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .vp-placeholder {
    display: flex; flex-direction: column;
    justify-content: center; align-items: center;
    flex: 1; gap: 0.75rem; padding: 1.5rem; text-align: center;
  }
  .vp-placeholder-icon {
    width: 48px; height: 48px; border-radius: 50%;
    background: rgba(212,175,55,0.06); border: 1px solid rgba(212,175,55,0.2);
    display: flex; align-items: center; justify-content: center; color: #d4af37;
  }
  .vp-placeholder p { color: #3a4250; font-size: 0.76rem; line-height: 1.6; margin: 0; }
  .vp-controls {
    display: flex; justify-content: center; align-items: center;
    gap: 0.5rem; padding: 0.75rem;
    background: rgba(8,11,15,0.8); border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
  }
  .vp-start-btn {
    background: linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.08));
    border: 1px solid rgba(212,175,55,0.4); color: #d4af37;
    padding: 0.45rem 1.4rem; border-radius: 8px; cursor: pointer;
    font-family: 'Syne',sans-serif; font-weight: 700; font-size: 0.78rem;
    letter-spacing: 0.08em; text-transform: uppercase;
    display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s;
  }
  .vp-start-btn:hover { background:rgba(212,175,55,0.2); border-color:rgba(212,175,55,0.7); box-shadow:0 0 16px rgba(212,175,55,0.15); }
  .vp-ctrl-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
    color: #8a9199; display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.2s; flex-shrink: 0;
  }
  .vp-ctrl-btn:hover { border-color:rgba(255,255,255,0.2); color:#c8cdd4; background:rgba(255,255,255,0.08); }
  .vp-ctrl-btn.danger { background:rgba(220,38,38,0.15); border-color:rgba(220,38,38,0.4); color:#f87171; }
  .vp-ctrl-btn.danger:hover { background:rgba(220,38,38,0.25); border-color:rgba(220,38,38,0.7); }
  .vp-ctrl-btn.muted { background:rgba(220,38,38,0.1); border-color:rgba(220,38,38,0.3); color:#f87171; }
  .vp-error { background:rgba(220,38,38,0.08); border-bottom:1px solid rgba(220,38,38,0.2); color:#f87171; padding:0.5rem 0.75rem; font-size:0.73rem; line-height:1.4; flex-shrink:0; }
  .vp-chat-fill { flex:1; overflow:hidden; display:flex; flex-direction:column; }
`;

function VideoTile({ stream, name, muted = false, cameraOn = true }) {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="vp-tile">
      {stream && cameraOn ? (
        <video ref={videoRef} autoPlay playsInline muted={muted} />
      ) : (
        <div className="vp-no-camera">
          <div className="vp-avatar">{name?.[0]?.toUpperCase() || '?'}</div>
        </div>
      )}
      <div className="vp-name-tag">{name}{muted ? ' · you' : ''}</div>
    </div>
  );
}

export default function VideoPanel({
  localStream, remoteStreams, callActive,
  micOn, cameraOn, error,
  onStartCall, onEndCall, onToggleMic, onToggleCamera,
  userName, socket, roomId, user,
}) {
  const [activeTab, setActiveTab] = useState('video');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;
    const handleMsg = () => {
      if (activeTab !== 'chat') setUnreadCount((n) => n + 1);
    };
    socket.on('chat-message', handleMsg);
    return () => socket.off('chat-message', handleMsg);
  }, [socket, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') setUnreadCount(0);
  };

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div className="vp-root">
        <div className="vp-tabs">
          <button className={`vp-tab ${activeTab === 'video' ? 'active' : ''}`} onClick={() => handleTabChange('video')}>
            <FiMonitor size={13} />
            Video
            {callActive && <span className="live-dot" />}
          </button>
          <button className={`vp-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleTabChange('chat')}>
            <FiMessageSquare size={13} />
            Chat
            {unreadCount > 0 && <span className="vp-badge">{unreadCount}</span>}
          </button>
        </div>

        {activeTab === 'video' && (
          <div className="vp-video-area">
            {error && <div className="vp-error">{error}</div>}
            <div className="vp-grid">
              {callActive ? (
                <>
                  <VideoTile stream={localStream} name={userName} muted cameraOn={cameraOn} />
                  {Object.entries(remoteStreams).map(([id, { stream, name }]) => (
                    <VideoTile key={id} stream={stream} name={name} muted={false} cameraOn />
                  ))}
                </>
              ) : (
                <div className="vp-placeholder">
                  <div className="vp-placeholder-icon"><FiVideo size={20} /></div>
                  <p>Start a call to enable video and audio with your collaborators</p>
                </div>
              )}
            </div>
            <div className="vp-controls">
              {!callActive ? (
                <button className="vp-start-btn" onClick={onStartCall}>
                  <FiPhone size={14} /> Start Call
                </button>
              ) : (
                <>
                  <button className={`vp-ctrl-btn ${!micOn ? 'muted' : ''}`} onClick={onToggleMic} title={micOn ? 'Mute' : 'Unmute'}>
                    {micOn ? <FiMic size={15} /> : <FiMicOff size={15} />}
                  </button>
                  <button className={`vp-ctrl-btn ${!cameraOn ? 'muted' : ''}`} onClick={onToggleCamera} title={cameraOn ? 'Turn off camera' : 'Turn on camera'}>
                    {cameraOn ? <FiVideo size={15} /> : <FiVideoOff size={15} />}
                  </button>
                  <button className="vp-ctrl-btn danger" onClick={onEndCall} title="End call">
                    <FiPhoneOff size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="vp-chat-fill">
            <ChatPanel socket={socket} roomId={roomId} user={user} />
          </div>
        )}
      </div>
    </>
  );
}
