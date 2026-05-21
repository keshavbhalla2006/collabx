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

export default function Room() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Room state
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor state
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [members, setMembers] = useState([]);
  const [versionMsg, setVersionMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Execution state
  const [executionResult, setExecutionResult] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [stdin, setStdin] = useState('');
  const [outputOpen, setOutputOpen] = useState(false);
  const [showCallToast, setShowCallToast] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);

  // NEW: Persist incoming data at Room level
  const [pendingMessages, setPendingMessages] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState(null);

  //WEBRTC
  const {
    localStream,
    remoteStreams,
    callActive,
    micOn,
    cameraOn,
    error: webrtcError,
    startCall,
    endCall,
    toggleMic,
    toggleCamera,
  } = useWebRTC({ socket, roomId: id, user });

  // Tracks whether a code change originated from socket (remote)
  // Prevents echoing remote changes back to the server
  const isRemoteChange = useRef(false);

  // ── Fetch room on mount ────────────────────────────────────
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

  // Show notification to join call when entering a room
  useEffect(() => {
    if (!loading && room && !callActive) {
      const timer = setTimeout(() => {
        if (!callActive) setShowCallToast(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [loading, room, callActive]);

  useEffect(() => {
    if (callActive) {
      setShowCallToast(false);
    }
  }, [callActive]);

  // ── Socket events ──────────────────────────────────────────
  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('join-room', { roomId: id });

    // Server sends full current state to this new joiner
    socket.on('room-state', ({ code: remoteCode, language: remoteLang }) => {
      isRemoteChange.current = true;
      setCode(remoteCode || getDefaultCode(remoteLang));
      setLanguage(remoteLang);
    });

    // Full member list sent to new joiner
    socket.on('current-members', ({ members: m }) => {
      setMembers(m.map((x) => ({ id: x.userId, name: x.name })));
    });

    // Someone else typed
    socket.on('code-update', ({ code: remoteCode }) => {
      isRemoteChange.current = true;
      setCode(remoteCode);
    });

    // Someone changed language
    socket.on('language-update', ({ language: remoteLang }) => {
      setLanguage(remoteLang);
      isRemoteChange.current = true;
      setCode(getDefaultCode(remoteLang));
    });

    // Someone joined
    socket.on('user-joined', ({ userId, name }) => {
      setMembers((prev) => {
        if (prev.find((m) => m.id === userId)) return prev;
        return [...prev, { id: userId, name }];
      });
    });

    // Someone left
    socket.on('user-left', ({ userId }) => {
      setMembers((prev) => prev.filter((m) => m.id !== userId));
    });

    // Version saved confirmation
    socket.on('version-saved', ({ savedBy, savedAt }) => {
      setVersionMsg(`Version saved by ${savedBy} at ${new Date(savedAt).toLocaleTimeString()}`);
      setTimeout(() => setVersionMsg(''), 4000);
    });

    // Execution result broadcast — everyone in room gets this
    socket.on('execution-output', (result) => {
      setExecutionResult(result);
      setExecuting(false);
      setOutputOpen(true);
    });

    // NEW: Capture chat messages regardless of tab state
    // socket.on('chat-message', (msg) => {
    //   setPendingMessages((prev) => [...prev, msg]);
    // });

    // NEW: Capture generated questions regardless of panel state
    socket.on('question-update', ({ question }) => {
      setPendingQuestion(question);

      // Auto-open question panel when a question arrives
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
      // socket.off('chat-message');
      socket.off('question-update');

    };
  }, [socket, room]);

  // ── Editor change handler ──────────────────────────────────
  const handleCodeChange = useCallback((newCode) => {
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      return;
    }
    setCode(newCode);
    socket?.emit('code-change', { roomId: id, code: newCode });
  }, [socket, id]);

  // ── Language change ────────────────────────────────────────
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    const newCode = getDefaultCode(newLang);
    setLanguage(newLang);
    setCode(newCode);
    socket?.emit('language-change', { roomId: id, language: newLang });
    socket?.emit('code-change', { roomId: id, code: newCode });
  };

  // ── Save version ───────────────────────────────────────────
  const handleSaveVersion = () => {
    socket?.emit('save-version', { roomId: id, code, language });
  };

  // ── Run code ───────────────────────────────────────────────
  const handleRun = async () => {
    setExecuting(true);
    setExecutionResult(null);
    setOutputOpen(true);

    try {
      const res = await executionAPI.run({ code, language, stdin, roomId: id });

      // Broadcast result to all room members via socket
      socket?.emit('execution-result', {
        roomId: id,
        result: res.data,
      });
    } catch (err) {
      const errorResult = {
        isError: true,
        status: 'Error',
        stderr: err.response?.data?.message || 'Execution failed. Please try again.',
        executedBy: user.name,
      };
      setExecutionResult(errorResult);
      setExecuting(false);
    }
  };

  // ── Copy invite code ───────────────────────────────────────
  const handleCopyCode = () => {
    navigator.clipboard.writeText(room?.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Render guards ──────────────────────────────────────────
  if (loading) return <div style={s.center}>Loading room...</div>;
  if (error) return (
    <div style={s.center}>
      <p style={{ color: '#e74c3c', marginBottom: '1rem' }}>{error}</p>
      <button style={s.btnSecondary} onClick={() => navigate('/dashboard')}>← Back</button>
    </div>
  );
  const isHost = room?.host_id === user?.id;
  return (
    <div style={s.page}>

      {/* ── Top bar ── */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate('/dashboard')}>←</button>
          <span style={s.roomName}>{room?.name}</span>
          <button style={s.inviteBtn} onClick={handleCopyCode}>
            {copied ? 'Copied!' : `# ${room?.invite_code}`}
          </button>
        </div>
        <div style={s.headerCenter}>
          <span style={s.logo}>CollabX</span>
        </div>
        <div style={s.headerRight}>
          <div style={s.membersRow}>
            {members.map((m, i) => (
              <div key={i} style={s.memberBadge} title={m.name}>
                {m.name[0].toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Toolbar ── */}
      <div style={s.toolbar}>
        <select style={s.langSelect} value={language} onChange={handleLanguageChange}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>

        <button style={s.saveBtn} onClick={handleSaveVersion}>
          Save Version
        </button>

        <button
          style={{ ...s.runBtn, opacity: executing ? 0.7 : 1 }}
          onClick={handleRun}
          disabled={executing}
        >
          {executing ? 'Running...' : '▶ Run'}
        </button>

        <button style={s.outputToggle} onClick={() => setOutputOpen(!outputOpen)}>
          {outputOpen ? 'Hide Output' : 'Show Output'}
        </button>

        <button
          style={{
            ...s.outputToggle,
            borderColor: questionOpen ? '#a78bfa' : '#555',
            color: questionOpen ? '#a78bfa' : '#9ca3af',
          }}
          onClick={() => setQuestionOpen(!questionOpen)}
        >
          {questionOpen ? 'Hide Question' : '🤖 AI Question'}
        </button>

        {versionMsg && <span style={s.versionMsg}>{versionMsg}</span>}
      </div>

      {/* ── Main area ── */}
      <div style={s.mainArea}>

        {questionOpen && (
          <div style={s.questionCol}>
            <QuestionPanel
              socket={socket}
              roomId={id}
              language={language}
              isHost={isHost}
              externalQuestion={pendingQuestion}
            />
          </div>
        )}
        {/* Editor + stdin */}
        <div style={{
          ...s.editorCol,
          width: questionOpen && outputOpen ? '40%'
            : questionOpen || outputOpen ? '55%'
              : '100%'
        }}>
          <div style={s.editorWrapper}>
            <Editor
              height="100%"
              language={monacoLang(language)}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'Fira Code', 'Consolas', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
              }}
            />
          </div>
          <StdinInput value={stdin} onChange={setStdin} />
        </div>

        {/* Output panel */}
        {outputOpen && (
          <div style={s.outputCol}>
            <OutputPanel result={executionResult} loading={executing} />
          </div>
        )}

        {/* ✅ Video panel (NEW) */}
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
      {/* ── Call notification toast ── */}
      {showCallToast && !callActive && (
        <Toast
          message="Your collaborator may be waiting! Enable your camera and microphone to start the video call."
          actionLabel="Start Call"
          onAction={() => {
            startCall();
            setShowCallToast(false);
          }}
          onClose={() => setShowCallToast(false)}
          duration={10000}
        />
      )}
    </div>
  );
}

// Monaco language ID mapping
function monacoLang(lang) {
  const map = {
    javascript: 'javascript',
    python: 'python',
    typescript: 'typescript',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    go: 'go',
    rust: 'rust',
    csharp: 'csharp',
    ruby: 'ruby',
    php: 'php',
    swift: 'swift',
    kotlin: 'kotlin',
    bash: 'shell',
  };
  return map[lang] || 'javascript';
}

// Default starter code per language
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

const s = {
  page: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e', fontFamily: 'sans-serif', overflow: 'hidden' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#ccc' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', height: '52px', background: '#2d2d2d', borderBottom: '1px solid #404040', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 },
  headerCenter: { flex: 1, textAlign: 'center' },
  headerRight: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  logo: { color: '#a78bfa', fontWeight: '700', fontSize: '1.1rem', letterSpacing: '0.5px' },
  backBtn: { background: 'transparent', border: 'none', color: '#ccc', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem 0.5rem' },
  roomName: { color: '#e2e8f0', fontWeight: '600', fontSize: '0.95rem' },
  inviteBtn: { background: '#374151', border: 'none', color: '#9ca3af', borderRadius: '6px', padding: '0.25rem 0.7rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'monospace' },
  membersRow: { display: 'flex', gap: '0.4rem' },
  memberBadge: { width: 30, height: 30, borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '600' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#252526', borderBottom: '1px solid #404040', flexShrink: 0 },
  langSelect: { background: '#3c3c3c', color: '#ccc', border: '1px solid #555', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.85rem', cursor: 'pointer' },
  saveBtn: { background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' },
  runBtn: { background: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 1rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' },
  outputToggle: { background: 'transparent', border: '1px solid #555', color: '#9ca3af', borderRadius: '6px', padding: '0.35rem 0.8rem', fontSize: '0.82rem', cursor: 'pointer' },
  versionMsg: { color: '#6ee7b7', fontSize: '0.82rem', marginLeft: '0.5rem' },
  mainArea: { display: 'flex', flex: 1, overflow: 'hidden' },
  editorCol: { display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden' },
  editorWrapper: { flex: 1, overflow: 'hidden' },
  outputCol: { width: '40%', borderLeft: '1px solid #333', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  btnSecondary: { padding: '0.5rem 1.2rem', border: '1px solid #6c63ff', borderRadius: '8px', background: 'transparent', color: '#6c63ff', cursor: 'pointer' }, questionCol: {
    width: '280px',
    flexShrink: 0,
    borderRight: '1px solid #333',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
};