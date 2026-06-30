import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { roomAPI, executionAPI } from '../services/api';
import OutputPanel from '../components/OutputPanel';
import StdinInput from '../components/StdinInput';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoPanel from '../components/VideoPanel';
import Toast from '../components/Toast';
import QuestionPanel from '../components/QuestionPanel';

const LANGUAGES = [
  'javascript','python','typescript','java','cpp','c',
  'go','rust','csharp','ruby','php','swift','kotlin','bash'
];

// ── Resize handle ─────────────────────────────────────────────
function ResizeHandle({ onMouseDown }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flexShrink: 0, width: 5, height: '100%',
        background: hov ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)',
        cursor: 'col-resize', transition: 'background 0.15s', zIndex: 20,
        position: 'relative', userSelect: 'none',
      }}
    >
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', width:4, height:24, borderRadius:2,
        background: hov ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.15)',
        transition: 'background 0.15s',
      }} />
    </div>
  );
}

// ── Resize hook ───────────────────────────────────────────────
function useResize(init, min, max, inverted = false) {
  const [width, setWidth] = useState(init);
  const drag = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    drag.current = true;
    startX.current = e.clientX;
    startW.current = width;
    const onMove = (ev) => {
      if (!drag.current) return;
      const d = inverted ? startX.current - ev.clientX : ev.clientX - startX.current;
      setWidth(Math.min(max, Math.max(min, startW.current + d)));
    };
    const onUp = () => {
      drag.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [width, min, max, inverted]);

  return { width, onMouseDown };
}

// ── Mobile bottom tab bar ─────────────────────────────────────
function MobileTabBar({ active, onChange, outputBadge }) {
  const tabs = [
    { id: 'code',     label: 'Code',     icon: '{ }' },
    { id: 'output',   label: 'Output',   icon: '▶',  badge: outputBadge },
    { id: 'question', label: 'Question', icon: '✦'   },
    { id: 'comms',    label: 'Chat',     icon: '💬'  },
  ];
  return (
    <div style={{
      display:'flex', borderTop:'1px solid rgba(212,175,55,0.15)',
      background:'rgba(8,11,15,0.98)', flexShrink:0, zIndex:30,
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex:1, padding:'0.55rem 0.25rem 0.45rem', border:'none',
            background: active === t.id ? 'rgba(212,175,55,0.08)' : 'transparent',
            borderTop: active === t.id ? '2px solid #d4af37' : '2px solid transparent',
            color: active === t.id ? '#d4af37' : '#4a5260',
            cursor:'pointer', fontFamily:'Syne,sans-serif', fontWeight:700,
            fontSize:'0.62rem', letterSpacing:'0.06em', textTransform:'uppercase',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'0.2rem',
            transition:'all 0.15s', position:'relative',
          }}
        >
          <span style={{ fontSize:'1rem', lineHeight:1 }}>{t.icon}</span>
          <span>{t.label}</span>
          {t.badge && (
            <span style={{
              position:'absolute', top:4, right:'25%',
              background:'#22a84e', color:'#fff', borderRadius:'50%',
              width:8, height:8, fontSize:0,
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&display=swap');
  *{box-sizing:border-box;}
  #root{width:100%!important;max-width:100%!important;margin:0!important;border:none!important;text-align:left!important;}
  .room-root{display:flex;flex-direction:column;height:100dvh;background:#080b0f;font-family:'Syne',sans-serif;overflow:hidden;color:#c8cdd4;}
  .room-header{display:flex;align-items:center;justify-content:space-between;padding:0 1rem;height:50px;background:rgba(12,16,22,0.95);border-bottom:1px solid rgba(212,175,55,0.15);backdrop-filter:blur(12px);flex-shrink:0;position:relative;z-index:10;}
  .room-header::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent);}
  .header-left{display:flex;align-items:center;gap:0.7rem;flex:1;min-width:0;}
  .header-center{flex-shrink:0;}
  .header-right{flex:1;display:flex;justify-content:flex-end;align-items:center;gap:0.5rem;}
  .back-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#8a9199;font-size:1rem;cursor:pointer;width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;transition:all .2s;font-family:'Space Mono',monospace;flex-shrink:0;}
  .back-btn:hover{border-color:rgba(212,175,55,0.4);color:#d4af37;}
  .room-name{color:#e8ecf0;font-weight:700;font-size:0.82rem;letter-spacing:.03em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position: absolute;margin-left: 17.5rem;}
  .invite-btn{background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.2);color:#d4af37;border-radius:5px;padding:0.1rem 0.3rem;font-size:0.68rem;cursor:pointer;font-family:'Space Mono',monospace;letter-spacing:.05em;transition:all .2s;white-space:nowrap;flex-shrink:0;margin-left: -5px;}
  .invite-btn:hover{background:rgba(212,175,55,0.12);}
  .logo-text{font-family:'Syne',sans-serif;font-weight:800;font-size:1rem;letter-spacing:.15em;text-transform:uppercase;background:linear-gradient(135deg,#d4af37,#f0d060,#d4af37);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .members-row{display:flex;gap:0.3rem;}
  .member-badge{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1a1f2e,#2a2f40);border:1.5px solid rgba(212,175,55,0.35);color:#d4af37;display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700;cursor:default;flex-shrink:0;}
  .room-toolbar{display:flex;align-items:center;gap:0.5rem;padding:0.45rem 1rem;background:rgba(10,14,20,0.9);border-bottom:1px solid rgba(255,255,255,0.05);flex-shrink:0;overflow-x:auto;scrollbar-width:none;}
  .room-toolbar::-webkit-scrollbar{display:none;}
  .lang-select{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#b8bec6;padding:0.3rem 0.55rem;font-size:0.75rem;font-family:'Space Mono',monospace;cursor:pointer;outline:none;flex-shrink:0;}
  .lang-select option{background:#0e1218;color:#c8cdd4;}
  .toolbar-divider{width:1px;height:18px;background:rgba(255,255,255,0.08);flex-shrink:0;}
  .btn-save{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#8a9199;padding:0.32rem 0.75rem;font-size:0.75rem;font-family:'Syne',sans-serif;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;}
  .btn-save:hover{color:#c8cdd4;background:rgba(255,255,255,0.08);}
  .btn-run{background:linear-gradient(135deg,#1a7a3a,#22a84e);border:none;border-radius:6px;color:#fff;padding:0.32rem 0.9rem;font-size:0.78rem;font-family:'Syne',sans-serif;font-weight:700;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;box-shadow:0 2px 10px rgba(34,168,78,0.25);white-space:nowrap;flex-shrink:0;}
  .btn-run:hover:not(:disabled){background:linear-gradient(135deg,#22a84e,#2dd460);transform:translateY(-1px);}
  .btn-run:disabled{opacity:.55;cursor:not-allowed;transform:none;}
  .btn-toggle{background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#6b7480;padding:0.32rem 0.7rem;font-size:0.72rem;font-family:'Syne',sans-serif;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap;flex-shrink:0;}
  .btn-toggle:hover{border-color:rgba(212,175,55,0.3);color:#d4af37;}
  .btn-toggle.active{border-color:rgba(212,175,55,0.45);color:#d4af37;background:rgba(212,175,55,0.08);}
  .version-msg{color:#4ade80;font-size:0.7rem;font-family:'Space Mono',monospace;white-space:nowrap;flex-shrink:0;}
  .room-main{display:flex;flex:1;overflow:hidden;min-height:0;}
  .editor-col{display:flex;flex-direction:column;overflow:hidden;min-width:0;flex:1;}
  .editor-wrapper{flex:1;overflow:hidden;background:#0a0d12;min-height:0;}
  .panel-fill{width:100%;height:100%;overflow:auto;}
  .room-center{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100dvh;background:#080b0f;font-family:'Syne',sans-serif;color:#6b7480;gap:1rem;}
  .room-center p{font-size:.9rem;letter-spacing:.05em;text-transform:uppercase;}
  .room-center .gold-dot{width:8px;height:8px;border-radius:50%;background:#d4af37;animation:pulse 1.4s infinite;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
  .btn-back{padding:.5rem 1.2rem;border:1px solid rgba(212,175,55,0.3);border-radius:8px;background:transparent;color:#d4af37;font-family:'Syne',sans-serif;font-weight:600;font-size:.82rem;cursor:pointer;letter-spacing:.06em;text-transform:uppercase;}
  ::-webkit-scrollbar{width:4px;height:4px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.2);border-radius:4px;}
`;

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [members, setMembers] = useState([]);
  const [versionMsg, setVersionMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [stdin, setStdin] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);
  const [showCallToast, setShowCallToast] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [newOutput, setNewOutput] = useState(false);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState('code');

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // Desktop resize
  const qResize  = useResize(280, 80, 600, false);
  const outResize = useResize(380, 80, 800, true);
  const vidResize = useResize(300, 180, 520, true);

  const {
    localStream, remoteStreams, callActive, micOn, cameraOn,
    error: webrtcError, startCall, endCall, toggleMic, toggleCamera,
  } = useWebRTC({ socket, roomId: id, user });

  const isRemoteChange = useRef(false);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await roomAPI.getRoom(id);
        const r = res.data.room;
        setRoom(r);
        setCode(r.current_code || getDefaultCode(r.language));
        setLanguage(r.language);
        setMembers([{ id: user.id, name: user.name }]);
      } catch (err) {
        setError(err.response?.data?.message || 'Room not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  useEffect(() => {
    if (!loading && room && !callActive) {
      const t = setTimeout(() => { if (!callActive) setShowCallToast(true); }, 1500);
      return () => clearTimeout(t);
    }
  }, [loading, room, callActive]);

  useEffect(() => { if (callActive) setShowCallToast(false); }, [callActive]);

  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join-room', { roomId: id });

    socket.on('room-state', ({ code: rc, language: rl }) => {
      isRemoteChange.current = true;
      setCode(rc || getDefaultCode(rl));
      setLanguage(rl);
    });
    socket.on('current-members', ({ members: m }) => setMembers(m.map(x => ({ id: x.userId, name: x.name }))));
    socket.on('code-update', ({ code: rc }) => { isRemoteChange.current = true; setCode(rc); });
    socket.on('language-update', ({ language: rl }) => {
      setLanguage(rl); isRemoteChange.current = true; setCode(getDefaultCode(rl));
    });
    socket.on('user-joined', ({ userId, name }) => {
      setMembers(prev => prev.find(m => m.id === userId) ? prev : [...prev, { id: userId, name }]);
    });
    socket.on('user-left', ({ userId }) => setMembers(prev => prev.filter(m => m.id !== userId)));
    socket.on('version-saved', ({ savedBy, savedAt }) => {
      setVersionMsg(`Saved by ${savedBy} · ${new Date(savedAt).toLocaleTimeString()}`);
      setTimeout(() => setVersionMsg(''), 4000);
    });
    socket.on('execution-output', (result) => {
      setExecutionResult(result);
      setExecuting(false);
      setOutputOpen(true);
      setNewOutput(true);
      if (isMobile) setMobileTab('output');
    });
    socket.on('question-update', ({ question }) => {
      setPendingQuestion(question);
      setQuestionOpen(true);
    });

    return () => {
      ['room-state','current-members','code-update','language-update',
       'user-joined','user-left','version-saved','execution-output','question-update']
        .forEach(e => socket.off(e));
    };
  }, [socket, room, isMobile]);

  const handleCodeChange = useCallback((newCode) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
    setCode(newCode);
    socket?.emit('code-change', { roomId: id, code: newCode });
  }, [socket, id]);

  const handleLanguageChange = (e) => {
    const nl = e.target.value, nc = getDefaultCode(nl);
    setLanguage(nl); setCode(nc);
    socket?.emit('language-change', { roomId: id, language: nl });
    socket?.emit('code-change', { roomId: id, code: nc });
  };

  const handleSaveVersion = () => socket?.emit('save-version', { roomId: id, code, language });

  const handleRun = async () => {
    setExecuting(true); setExecutionResult(null); setOutputOpen(true); setNewOutput(false);
    try {
      const res = await executionAPI.run({ code, language, stdin, roomId: id });
      socket?.emit('execution-result', { roomId: id, result: res.data });
    } catch (err) {
      setExecutionResult({ isError:true, status:'Error', stderr: err.response?.data?.message || 'Execution failed.', executedBy: user.name });
      setExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.invite_code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <><style>{STYLES}</style><div className="room-center"><div className="gold-dot" /><p>Loading room</p></div></>;
  if (error) return <><style>{STYLES}</style><div className="room-center"><p style={{color:'#f87171'}}>{error}</p><button className="btn-back" onClick={()=>navigate('/dashboard')}>← Dashboard</button></div></>;

  const isHost = room?.host_id === user?.id;

  // Shared header & toolbar
  const Header = (
    <header className="room-header">
      <div className="header-left">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
        <span className="room-name">{room?.name}</span>
        <button className="invite-btn" onClick={handleCopyCode}>{copied ? '✓' : `#${room?.invite_code}`}</button>
      </div>
      <div className="header-center"><span className="logo-text">CollabX</span></div>
      <div className="header-right">
        <div className="members-row">
          {members.slice(0, isMobile ? 2 : 5).map((m, i) => (
            <div key={i} className="member-badge" title={m.name}>{m.name[0].toUpperCase()}</div>
          ))}
        </div>
      </div>
    </header>
  );

  const Toolbar = (
    <div className="room-toolbar">
      <select className="lang-select" value={language} onChange={handleLanguageChange}>
        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
      <div className="toolbar-divider" />
      <button className="btn-save" onClick={handleSaveVersion}>Save</button>
      <button className="btn-run" onClick={handleRun} disabled={executing}>
        {executing ? '● Running' : '▶ Run'}
      </button>
      {!isMobile && (
        <>
          <div className="toolbar-divider" />
          <button className={`btn-toggle ${outputOpen ? 'active' : ''}`} onClick={() => setOutputOpen(!outputOpen)}>Output</button>
          <button className={`btn-toggle ${questionOpen ? 'active' : ''}`} onClick={() => setQuestionOpen(!questionOpen)}>✦ AI Question</button>
        </>
      )}
      {versionMsg && <span className="version-msg">✓ {versionMsg}</span>}
    </div>
  );

  const vpProps = {
    localStream, remoteStreams, callActive, micOn, cameraOn,
    error: webrtcError, onStartCall: startCall, onEndCall: endCall,
    onToggleMic: toggleMic, onToggleCamera: toggleCamera,
    userName: user?.name, socket, roomId: id, user,
  };

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="room-root">
          {Header}
          {Toolbar}

          <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
            {/* Code */}
            <div style={{ display: mobileTab === 'code' ? 'flex' : 'none', flex:1, flexDirection:'column', minHeight:0 }}>
              <div style={{ flex:1, overflow:'hidden' }}>
                <Editor
                  height="100%"
                  language={monacoLang(language)}
                  value={code}
                  onChange={handleCodeChange}
                  theme="vs-dark"
                  options={{
                    fontSize:14, fontFamily:"'Space Mono','Fira Code',monospace",
                    minimap:{enabled:false}, scrollBeyondLastLine:false,
                    wordWrap:'on', automaticLayout:true, tabSize:2,
                    lineNumbers:'on', cursorBlinking:'smooth',
                    folding:true, padding:{top:12,bottom:12},
                  }}
                />
              </div>
              <StdinInput value={stdin} onChange={setStdin} />
            </div>

            {/* Output */}
            {mobileTab === 'output' && (
              <div style={{ flex:1, overflow:'auto' }}>
                <OutputPanel result={executionResult} loading={executing} />
              </div>
            )}

            {/* Question */}
            {mobileTab === 'question' && (
              <div style={{ flex:1, overflow:'auto' }}>
                <QuestionPanel socket={socket} roomId={id} language={language} isHost={isHost} externalQuestion={pendingQuestion} />
              </div>
            )}

            {/* Comms (Video + Chat) */}
            {mobileTab === 'comms' && (
              <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <VideoPanel {...vpProps} />
              </div>
            )}
          </div>

          <MobileTabBar
            active={mobileTab}
            onChange={(tab) => { setMobileTab(tab); if (tab === 'output') setNewOutput(false); }}
            outputBadge={newOutput && mobileTab !== 'output'}
          />

          {showCallToast && !callActive && (
            <Toast
              message="Start a call to collaborate with video and audio."
              actionLabel="Start Call"
              onAction={() => { startCall(); setShowCallToast(false); setMobileTab('comms'); }}
              onClose={() => setShowCallToast(false)}
              duration={10000}
            />
          )}
        </div>
      </>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <div className="room-root">
        {Header}
        {Toolbar}

        <div className="room-main">
          {/* Question */}
          {questionOpen && (
            <>
              <div style={{ width: qResize.width, flexShrink:0, overflow:'auto', background:'#090c11', minWidth:80 }}>
                <QuestionPanel socket={socket} roomId={id} language={language} isHost={isHost} externalQuestion={pendingQuestion} />
              </div>
              <ResizeHandle onMouseDown={qResize.onMouseDown} />
            </>
          )}

          {/* Editor */}
          <div className="editor-col">
            <div className="editor-wrapper">
              <Editor
                height="100%"
                language={monacoLang(language)}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize:14, fontFamily:"'Space Mono','Fira Code',monospace",
                  minimap:{enabled:false}, scrollBeyondLastLine:false,
                  wordWrap:'on', automaticLayout:true, tabSize:2,
                  lineNumbers:'on', renderLineHighlight:'all', cursorBlinking:'smooth',
                  lineDecorationsWidth:8, folding:true,
                  bracketPairColorization:{enabled:true}, padding:{top:16,bottom:16},
                }}
              />
            </div>
            <StdinInput value={stdin} onChange={setStdin} />
          </div>

          {/* Output */}
          {outputOpen && (
            <>
              <ResizeHandle onMouseDown={outResize.onMouseDown} />
              <div style={{ width: outResize.width, flexShrink:0, display:'flex', flexDirection:'column', background:'#080b0f', minWidth:80 }}>
                <OutputPanel result={executionResult} loading={executing} />
              </div>
            </>
          )}

          {/* Video/Chat */}
          <ResizeHandle onMouseDown={vidResize.onMouseDown} />
          <div style={{ width: vidResize.width, flexShrink:0, display:'flex', flexDirection:'column', minWidth:180 }}>
            <VideoPanel {...vpProps} />
          </div>
        </div>

        {showCallToast && !callActive && (
          <Toast
            message="Your collaborator may be waiting! Enable your camera and microphone to start the video call."
            actionLabel="Start Call"
            onAction={() => { startCall(); setShowCallToast(false); }}
            onClose={() => setShowCallToast(false)}
            duration={10000}
          />
        )}
      </div>
    </>
  );
}

function monacoLang(lang) {
  return { javascript:'javascript',python:'python',typescript:'typescript',java:'java',cpp:'cpp',c:'c',go:'go',rust:'rust',csharp:'csharp',ruby:'ruby',php:'php',swift:'swift',kotlin:'kotlin',bash:'shell' }[lang] || 'javascript';
}

function getDefaultCode(lang) {
  return {
    javascript:`// JavaScript\nconsole.log("Hello, CollabX!");`,
    python:`# Python\nprint("Hello, CollabX!")`,
    typescript:`// TypeScript\nconst greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet("CollabX"));`,
    java:`// Java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, CollabX!");\n  }\n}`,
    cpp:`// C++\n#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, CollabX!" << endl;\n  return 0;\n}`,
    c:`// C\n#include <stdio.h>\nint main() {\n  printf("Hello, CollabX!\\n");\n  return 0;\n}`,
    go:`// Go\npackage main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, CollabX!")\n}`,
    rust:`// Rust\nfn main() {\n  println!("Hello, CollabX!");\n}`,
    csharp:`// C#\nusing System;\nclass Main {\n  static void Main() {\n    Console.WriteLine("Hello, CollabX!");\n  }\n}`,
    ruby:`# Ruby\nputs "Hello, CollabX!"`,
    php:`<?php\necho "Hello, CollabX!\\n";`,
    swift:`// Swift\nprint("Hello, CollabX!")`,
    kotlin:`// Kotlin\nfun main() {\n  println("Hello, CollabX!")\n}`,
    bash:`#!/bin/bash\necho "Hello, CollabX!"`,
  }[lang] || '';
}
