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
  'javascript', 'python', 'typescript', 'java',
  'cpp', 'c', 'go', 'rust', 'csharp', 'ruby',
  'php', 'swift', 'kotlin', 'bash'
];

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;500;600;700;800&display=swap');

  * { box-sizing: border-box; }

  .room-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #080b0f;
    font-family: 'Syne', sans-serif;
    overflow: hidden;
    color: #c8cdd4;
  }

  /* ── HEADER ── */
  .room-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 1.25rem;
    height: 54px;
    background: rgba(12, 16, 22, 0.95);
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    backdrop-filter: blur(12px);
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .room-header::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent);
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    flex: 1;
  }

  .header-center {
    flex: 1;
    text-align: center;
  }

  .header-right {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.75rem;
  }

  .back-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    color: #8a9199;
    font-size: 1rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-family: 'Space Mono', monospace;
  }

  .back-btn:hover {
    border-color: rgba(212,175,55,0.4);
    color: #d4af37;
    background: rgba(212,175,55,0.06);
  }

  .room-name {
    color: #e8ecf0;
    font-weight: 700;
    font-size: 0.88rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .invite-btn {
    background: rgba(212,175,55,0.06);
    border: 1px solid rgba(212,175,55,0.2);
    color: #d4af37;
    border-radius: 6px;
    padding: 0.22rem 0.7rem;
    font-size: 0.72rem;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.05em;
    transition: all 0.2s;
  }

  .invite-btn:hover {
    background: rgba(212,175,55,0.12);
    border-color: rgba(212,175,55,0.45);
  }

  .logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 1.1rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    background: linear-gradient(135deg, #d4af37, #f0d060, #d4af37);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .members-row {
    display: flex;
    gap: 0.35rem;
  }

  .member-badge {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a1f2e, #2a2f40);
    border: 1.5px solid rgba(212,175,55,0.35);
    color: #d4af37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0;
    cursor: default;
  }

  /* ── TOOLBAR ── */
  .room-toolbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 1.25rem;
    background: rgba(10, 14, 20, 0.9);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }

  .lang-select {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    color: #b8bec6;
    padding: 0.32rem 0.65rem;
    font-size: 0.78rem;
    font-family: 'Space Mono', monospace;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
  }

  .lang-select:focus {
    border-color: rgba(212,175,55,0.4);
    color: #d4af37;
  }

  .lang-select option {
    background: #0e1218;
    color: #c8cdd4;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  .btn-save {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    color: #8a9199;
    padding: 0.35rem 0.9rem;
    font-size: 0.78rem;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.03em;
  }

  .btn-save:hover {
    border-color: rgba(255,255,255,0.22);
    color: #c8cdd4;
    background: rgba(255,255,255,0.08);
  }

  .btn-run {
    background: linear-gradient(135deg, #1a7a3a, #22a84e);
    border: none;
    border-radius: 7px;
    color: #fff;
    padding: 0.35rem 1.1rem;
    font-size: 0.8rem;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    cursor: pointer;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(34,168,78,0.25);
  }

  .btn-run:hover:not(:disabled) {
    background: linear-gradient(135deg, #22a84e, #2dd460);
    box-shadow: 0 4px 18px rgba(34,168,78,0.4);
    transform: translateY(-1px);
  }

  .btn-run:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }

  .btn-toggle {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    color: #6b7480;
    padding: 0.35rem 0.8rem;
    font-size: 0.75rem;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .btn-toggle:hover {
    border-color: rgba(212,175,55,0.3);
    color: #d4af37;
    background: rgba(212,175,55,0.04);
  }

  .btn-toggle.active {
    border-color: rgba(212,175,55,0.45);
    color: #d4af37;
    background: rgba(212,175,55,0.08);
  }

  .version-msg {
    color: #4ade80;
    font-size: 0.74rem;
    font-family: 'Space Mono', monospace;
    margin-left: 0.25rem;
  }

  /* ── MAIN AREA ── */
  .room-main {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .editor-col {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.2s ease;
    position: relative;
  }

  .editor-col::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 1px;
    height: 100%;
    background: linear-gradient(180deg, transparent, rgba(212,175,55,0.15) 30%, rgba(212,175,55,0.15) 70%, transparent);
    pointer-events: none;
  }

  .editor-wrapper {
    flex: 1;
    overflow: hidden;
    background: #0a0d12;
  }

  .output-col {
    width: 38%;
    flex-shrink: 0;
    border-left: 1px solid rgba(255,255,255,0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #080b0f;
  }

  .question-col {
    width: 280px;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.06);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background: #090c11;
  }

  /* ── LOADING / ERROR ── */
  .room-center {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #080b0f;
    font-family: 'Syne', sans-serif;
    color: #6b7480;
    gap: 1rem;
  }

  .room-center p {
    font-size: 0.95rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .room-center .gold-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #d4af37;
    animation: pulse 1.4s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }

  .btn-back {
    padding: 0.55rem 1.4rem;
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 8px;
    background: transparent;
    color: #d4af37;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-back:hover {
    background: rgba(212,175,55,0.08);
    border-color: rgba(212,175,55,0.6);
  }

  /* scrollbar */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(212,175,55,0.2); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(212,175,55,0.4); }
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
  const [pendingMessages, setPendingMessages] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState(null);

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
      const timer = setTimeout(() => { if (!callActive) setShowCallToast(true); }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, room, callActive]);

  useEffect(() => { if (callActive) setShowCallToast(false); }, [callActive]);

  useEffect(() => {
    if (!socket || !room) return;
    socket.emit('join-room', { roomId: id });

    socket.on('room-state', ({ code: remoteCode, language: remoteLang }) => {
      isRemoteChange.current = true;
      setCode(remoteCode || getDefaultCode(remoteLang));
      setLanguage(remoteLang);
    });
    socket.on('current-members', ({ members: m }) => {
      setMembers(m.map((x) => ({ id: x.userId, name: x.name })));
    });
    socket.on('code-update', ({ code: remoteCode }) => {
      isRemoteChange.current = true;
      setCode(remoteCode);
    });
    socket.on('language-update', ({ language: remoteLang }) => {
      setLanguage(remoteLang);
      isRemoteChange.current = true;
      setCode(getDefaultCode(remoteLang));
    });
    socket.on('user-joined', ({ userId, name }) => {
      setMembers((prev) => {
        if (prev.find((m) => m.id === userId)) return prev;
        return [...prev, { id: userId, name }];
      });
    });
    socket.on('user-left', ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    });
    socket.on('version-saved', ({ savedBy, savedAt }) => {
      setVersionMsg(`Saved by ${savedBy} · ${new Date(savedAt).toLocaleTimeString()}`);
      setTimeout(() => setVersionMsg(''), 4000);
    });
    socket.on('execution-output', (result) => {
      setExecutionResult(result);
      setExecuting(false);
      setOutputOpen(true);
    });
    socket.on('question-update', ({ question }) => {
      setPendingQuestion(question);
      setQuestionOpen(true);
    });

    return () => {
      socket.off('room-state');
      socket.off('current-members');
      socket.off('code-update');
      socket.off('language-update');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('version-saved');
      socket.off('execution-output');
      socket.off('question-update');
    };
  }, [socket, room]);

  const handleCodeChange = useCallback((newCode) => {
    if (isRemoteChange.current) { isRemoteChange.current = false; return; }
    setCode(newCode);
    socket?.emit('code-change', { roomId: id, code: newCode });
  }, [socket, id]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const newCode = getDefaultCode(newLang);
    setLanguage(newLang);
    setCode(newCode);
    socket?.emit('language-change', { roomId: id, language: newLang });
    socket?.emit('code-change', { roomId: id, code: newCode });
  };

  const handleSaveVersion = () => {
    socket?.emit('save-version', { roomId: id, code, language });
  };

  const handleRun = async () => {
    setExecuting(true);
    setExecutionResult(null);
    setOutputOpen(true);
    try {
      const res = await executionAPI.run({ code, language, stdin, roomId: id });
      socket?.emit('execution-result', { roomId: id, result: res.data });
    } catch (err) {
      const errorResult = {
        isError: true, status: 'Error',
        stderr: err.response?.data?.message || 'Execution failed.',
        executedBy: user.name,
      };
      setExecutionResult(errorResult);
      setExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="room-center">
        <div className="gold-dot" />
        <p>Loading room</p>
      </div>
    </>
  );

  if (error) return (
    <>
      <style>{STYLES}</style>
      <div className="room-center">
        <p style={{ color: '#f87171' }}>{error}</p>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>
    </>
  );

  const isHost = room?.host_id === user?.id;

  // Calculate editor width
  const editorWidth = questionOpen && outputOpen ? '40%'
    : questionOpen || outputOpen ? '55%'
    : '100%';

  return (
    <>
      <style>{STYLES}</style>
      <div className="room-root">

        {/* HEADER */}
        <header className="room-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>←</button>
            <span className="room-name">{room?.name}</span>
            <button className="invite-btn" onClick={handleCopyCode}>
              {copied ? '✓ copied' : `# ${room?.invite_code}`}
            </button>
          </div>

          <div className="header-center">
            <span className="logo-text">CollabX</span>
          </div>

          <div className="header-right">
            <div className="members-row">
              {members.map((m, i) => (
                <div key={i} className="member-badge" title={m.name}>
                  {m.name[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* TOOLBAR */}
        <div className="room-toolbar">
          <select className="lang-select" value={language} onChange={handleLanguageChange}>
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>

          <div className="toolbar-divider" />

          <button className="btn-save" onClick={handleSaveVersion}>Save Version</button>

          <button
            className="btn-run"
            style={{ opacity: executing ? 0.65 : 1 }}
            onClick={handleRun}
            disabled={executing}
          >
            {executing ? '● Running' : '▶ Run'}
          </button>

          <div className="toolbar-divider" />

          <button
            className={`btn-toggle ${outputOpen ? 'active' : ''}`}
            onClick={() => setOutputOpen(!outputOpen)}
          >
            Output
          </button>

          <button
            className={`btn-toggle ${questionOpen ? 'active' : ''}`}
            onClick={() => setQuestionOpen(!questionOpen)}
          >
            ✦ AI Question
          </button>

          {versionMsg && <span className="version-msg">✓ {versionMsg}</span>}
        </div>

        {/* MAIN */}
        <div className="room-main">

          {questionOpen && (
            <div className="question-col">
              <QuestionPanel
                socket={socket}
                roomId={id}
                language={language}
                isHost={isHost}
                externalQuestion={pendingQuestion}
              />
            </div>
          )}

          <div className="editor-col" style={{ width: editorWidth }}>
            <div className="editor-wrapper">
              <Editor
                height="100%"
                language={monacoLang(language)}
                value={code}
                onChange={handleCodeChange}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'Space Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  tabSize: 2,
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorBlinking: 'smooth',
                  lineDecorationsWidth: 8,
                  folding: true,
                  bracketPairColorization: { enabled: true },
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
            <StdinInput value={stdin} onChange={setStdin} />
          </div>

          {outputOpen && (
            <div className="output-col">
              <OutputPanel result={executionResult} loading={executing} />
            </div>
          )}

          <VideoPanel
            localStream={localStream}
            remoteStreams={remoteStreams}
            callActive={callActive}
            micOn={micOn}
            cameraOn={cameraOn}
            error={webrtcError}
            onStartCall={startCall}
            onEndCall={endCall}
            onToggleMic={toggleMic}
            onToggleCamera={toggleCamera}
            userName={user?.name}
            socket={socket}
            roomId={id}
            user={user}
          />
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
  const map = {
    javascript: 'javascript', python: 'python', typescript: 'typescript',
    java: 'java', cpp: 'cpp', c: 'c', go: 'go', rust: 'rust',
    csharp: 'csharp', ruby: 'ruby', php: 'php', swift: 'swift',
    kotlin: 'kotlin', bash: 'shell',
  };
  return map[lang] || 'javascript';
}

function getDefaultCode(lang) {
  const defaults = {
    javascript: `// JavaScript\nconsole.log("Hello, CollabX!");`,
    python: `# Python\nprint("Hello, CollabX!")`,
    typescript: `// TypeScript\nconst greet = (name: string): string => \`Hello, \${name}!\`;\nconsole.log(greet("CollabX"));`,
    java: `// Java\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, CollabX!");\n  }\n}`,
    cpp: `// C++\n#include <iostream>\nusing namespace std;\nint main() {\n  cout << "Hello, CollabX!" << endl;\n  return 0;\n}`,
    c: `// C\n#include <stdio.h>\nint main() {\n  printf("Hello, CollabX!\\n");\n  return 0;\n}`,
    go: `// Go\npackage main\nimport "fmt"\nfunc main() {\n  fmt.Println("Hello, CollabX!")\n}`,
    rust: `// Rust\nfn main() {\n  println!("Hello, CollabX!");\n}`,
    csharp: `// C#\nusing System;\nclass Main {\n  static void Main() {\n    Console.WriteLine("Hello, CollabX!");\n  }\n}`,
    ruby: `# Ruby\nputs "Hello, CollabX!"`,
    php: `<?php\necho "Hello, CollabX!\\n";`,
    swift: `// Swift\nprint("Hello, CollabX!")`,
    kotlin: `// Kotlin\nfun main() {\n  println("Hello, CollabX!")\n}`,
    bash: `#!/bin/bash\necho "Hello, CollabX!"`,
  };
  return defaults[lang] || '';
}
