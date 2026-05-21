import { useState, useEffect } from 'react';
import { FiRefreshCw, FiChevronDown, FiChevronUp, FiCpu } from 'react-icons/fi';
import { aiAPI, roomAPI } from '../services/api';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TOPICS = [
  'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs',
  'Dynamic Programming', 'Recursion', 'Sorting', 'Binary Search',
  'Stack and Queue', 'Hash Maps', 'Two Pointers', 'Sliding Window',
];

export default function QuestionPanel({
  socket,
  roomId,
  language,
  isHost,
  externalQuestion,
}) {
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [topic, setTopic] = useState('Arrays');
  const [difficulty, setDifficulty] = useState('Medium');
  const [showHints, setShowHints] = useState(false);
  const [showStarter, setShowStarter] = useState(false);

  // Load saved question when component mounts
  useEffect(() => {
    if (!roomId) return;

    const loadQuestion = async () => {
      try {
        const res = await roomAPI.getRoom(roomId);
        const savedQuestion = res.data.room?.current_question;

        if (savedQuestion) {
          const parsed =
            typeof savedQuestion === 'string'
              ? JSON.parse(savedQuestion)
              : savedQuestion;

          setQuestion(parsed);
        }
      } catch (err) {
        console.error('Failed to load saved question:', err);
      }
    };

    loadQuestion();
  }, [roomId]);

  // // Listen for question updates from other room members
  // // (when host loads a question, everyone gets it)
  // useEffect(() => {
  //   if (!socket) return;

  //   const handleQuestionUpdate = ({ question: q }) => {
  //     setQuestion(q);
  //     setShowHints(false);
  //     setShowStarter(false);
  //     setError('');
  //   };

  //   socket.on('question-update', handleQuestionUpdate);

  //   return () => {
  //     socket.off('question-update', handleQuestionUpdate);
  //   };
  // }, [socket]);

  // Sync question from Room.jsx
  useEffect(() => {
    if (externalQuestion) {
      setQuestion(externalQuestion);

      // Reset UI state on new question
      setShowHints(false);
      setShowStarter(false);
      setError('');
    }
  }, [externalQuestion]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setShowHints(false);
    setShowStarter(false);

    try {
      const res = await aiAPI.getQuestion({
        topic,
        difficulty,
        language,
      });

      const q = res.data.question;

      // Broadcast to all room members via socket
      socket?.emit('question-loaded', {
        roomId,
        question: q,
      });

      // setQuestion will be called by the socket listener above
      // for everyone including the host

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to generate question. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (d) => {
    if (d === 'Easy') return '#4ade80';
    if (d === 'Medium') return '#facc15';
    if (d === 'Hard') return '#f87171';
    return '#9ca3af';
  };

  return (
    <div style={s.panel}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <FiCpu size={14} color="#a78bfa" />
          <span style={s.title}>AI Question Engine</span>
        </div>

        {!isHost && question && (
          <span style={s.guestNote}>loaded by host</span>
        )}
      </div>

      {/* ── Controls — only host can generate ── */}
      {isHost && (
        <div style={s.controls}>
          <select
            style={s.select}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            style={s.select}
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            style={{
              ...s.generateBtn,
              opacity: loading ? 0.7 : 1,
            }}
            onClick={handleGenerate}
            disabled={loading}
          >
            <FiRefreshCw
              size={13}
              style={{
                animation: loading
                  ? 'spin 1s linear infinite'
                  : 'none',
              }}
            />

            {loading
              ? 'Generating...'
              : 'Generate Question'}
          </button>
        </div>
      )}

      {error && <div style={s.error}>{error}</div>}

      {/* ── Loading state ── */}
      {loading && (
        <div style={s.loadingBox}>
          <p style={s.loadingText}>
            Grok is generating your question...
          </p>

          <div style={s.loadingDots}>
            <span style={s.dot}>●</span>

            <span
              style={{
                ...s.dot,
                animationDelay: '0.2s',
              }}
            >
              ●
            </span>

            <span
              style={{
                ...s.dot,
                animationDelay: '0.4s',
              }}
            >
              ●
            </span>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!question && !loading && (
        <div style={s.empty}>
          <FiCpu size={32} color="#374151" />

          <p style={s.emptyText}>
            {isHost
              ? 'Select a topic and difficulty, then generate a question.'
              : 'Waiting for the host to load a question...'}
          </p>
        </div>
      )}

      {/* ── Question display ── */}
      {question && !loading && (
        <div style={s.questionBody}>

          {/* Title + meta */}
          <div style={s.titleRow}>
            <h2 style={s.questionTitle}>
              {question.title}
            </h2>

            <div style={s.metaRow}>
              <span
                style={{
                  ...s.diffBadge,
                  color: difficultyColor(question.difficulty),
                  borderColor: difficultyColor(question.difficulty),
                }}
              >
                {question.difficulty}
              </span>

              <span style={s.topicBadge}>
                {question.topic}
              </span>
            </div>
          </div>

          {/* Description */}
          <div style={s.section}>
            <p style={s.description}>
              {question.description}
            </p>
          </div>

          {/* Examples */}
          {question.examples?.map((ex, i) => (
            <div key={i} style={s.exampleBox}>
              <p style={s.exampleLabel}>
                Example {i + 1}
              </p>

              <div style={s.exampleContent}>
                <p style={s.exampleLine}>
                  <span style={s.exLabel}>Input:</span>

                  <code style={s.code}>
                    {ex.input}
                  </code>
                </p>

                <p style={s.exampleLine}>
                  <span style={s.exLabel}>Output:</span>

                  <code style={s.code}>
                    {ex.output}
                  </code>
                </p>

                {ex.explanation && (
                  <p style={s.explanation}>
                    <span style={s.exLabel}>
                      Explanation:
                    </span>{' '}
                    {ex.explanation}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Constraints */}
          {question.constraints?.length > 0 && (
            <div style={s.section}>
              <p style={s.sectionLabel}>
                Constraints
              </p>

              <ul style={s.list}>
                {question.constraints.map((c, i) => (
                  <li key={i} style={s.listItem}>
                    <code style={s.code}>{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hints — collapsible */}
          {question.hints?.length > 0 && (
            <div style={s.section}>
              <button
                style={s.collapseBtn}
                onClick={() => setShowHints(!showHints)}
              >
                {showHints
                  ? <FiChevronUp size={14} />
                  : <FiChevronDown size={14} />}

                {showHints
                  ? 'Hide Hints'
                  : `Show Hints (${question.hints.length})`}
              </button>

              {showHints && (
                <ol style={s.list}>
                  {question.hints.map((h, i) => (
                    <li key={i} style={s.listItem}>
                      {h}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {/* Starter code — collapsible */}
          {question.starterCode && (
            <div style={s.section}>
              <button
                style={s.collapseBtn}
                onClick={() => setShowStarter(!showStarter)}
              >
                {showStarter
                  ? <FiChevronUp size={14} />
                  : <FiChevronDown size={14} />}

                {showStarter
                  ? 'Hide Starter Code'
                  : 'Show Starter Code'}
              </button>

              {showStarter && (
                <div style={s.starterBox}>
                  {Object.entries(question.starterCode).map(
                    ([lang, code]) => (
                      <div key={lang} style={s.starterLang}>
                        <p style={s.starterLangLabel}>
                          {lang}
                        </p>

                        <pre style={s.pre}>
                          {code}
                        </pre>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes blink {
          0%, 100% {
            opacity: 0.2;
          }

          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

const s = {
  panel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#0f0f1a',
    fontFamily: 'sans-serif',
    overflowY: 'auto',
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.6rem 0.75rem',
    background: '#13131f',
    borderBottom: '1px solid #2d2d4e',
    flexShrink: 0,
  },

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },

  title: {
    color: '#a78bfa',
    fontSize: '0.8rem',
    fontWeight: '600',
  },

  guestNote: {
    color: '#4b5563',
    fontSize: '0.7rem',
  },

  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem',
    borderBottom: '1px solid #2d2d4e',
    flexShrink: 0,
  },

  select: {
    background: '#1f1f35',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#e2e8f0',
    padding: '0.4rem 0.6rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    width: '100%',
  },

  generateBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    background: '#6c63ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.5rem',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontWeight: '600',
    width: '100%',
  },

  error: {
    background: '#450a0a',
    color: '#f87171',
    padding: '0.5rem 0.75rem',
    fontSize: '0.75rem',
  },

  loadingBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '0.75rem',
  },

  loadingText: {
    color: '#9ca3af',
    fontSize: '0.82rem',
  },

  loadingDots: {
    display: 'flex',
    gap: '4px',
  },

  dot: {
    color: '#6c63ff',
    fontSize: '1rem',
    animation: 'blink 1.2s infinite',
    display: 'inline-block',
  },

  empty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
  },

  emptyText: {
    color: '#4b5563',
    fontSize: '0.82rem',
    textAlign: 'center',
    lineHeight: 1.6,
  },

  questionBody: {
    padding: '0.75rem',
    overflowY: 'auto',
  },

  titleRow: {
    marginBottom: '0.75rem',
  },

  questionTitle: {
    color: '#f1f5f9',
    fontSize: '1rem',
    fontWeight: '700',
    margin: '0 0 0.5rem',
    lineHeight: 1.3,
  },

  metaRow: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },

  diffBadge: {
    fontSize: '0.72rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid',
    fontWeight: '600',
  },

  topicBadge: {
    fontSize: '0.72rem',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    background: '#1f1f35',
    color: '#9ca3af',
  },

  section: {
    marginBottom: '1rem',
  },

  sectionLabel: {
    color: '#9ca3af',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '0.4rem',
  },

  description: {
    color: '#e2e8f0',
    fontSize: '0.85rem',
    lineHeight: 1.7,
    margin: 0,
  },

  exampleBox: {
    background: '#13131f',
    border: '1px solid #2d2d4e',
    borderRadius: '8px',
    padding: '0.75rem',
    marginBottom: '0.75rem',
  },

  exampleLabel: {
    color: '#6c63ff',
    fontSize: '0.72rem',
    fontWeight: '700',
    margin: '0 0 0.5rem',
    textTransform: 'uppercase',
  },

  exampleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },

  exampleLine: {
    margin: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    alignItems: 'center',
  },

  exLabel: {
    color: '#9ca3af',
    fontSize: '0.78rem',
    fontWeight: '600',
  },

  code: {
    background: '#1f1f35',
    color: '#a78bfa',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    fontSize: '0.78rem',
    fontFamily: "'Fira Code', monospace",
  },

  explanation: {
    color: '#9ca3af',
    fontSize: '0.78rem',
    margin: '0.2rem 0 0',
    lineHeight: 1.5,
  },

  list: {
    margin: '0.25rem 0 0',
    paddingLeft: '1.2rem',
  },

  listItem: {
    color: '#d1d5db',
    fontSize: '0.82rem',
    marginBottom: '0.25rem',
    lineHeight: 1.5,
  },

  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    background: 'transparent',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#9ca3af',
    padding: '0.3rem 0.6rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    marginBottom: '0.5rem',
  },

  starterBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  starterLang: {
    background: '#13131f',
    border: '1px solid #2d2d4e',
    borderRadius: '6px',
    overflow: 'hidden',
  },

  starterLangLabel: {
    color: '#6c63ff',
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '0.3rem 0.6rem',
    background: '#1f1f35',
    margin: 0,
    textTransform: 'uppercase',
  },

  pre: {
    color: '#e2e8f0',
    fontSize: '0.75rem',
    padding: '0.6rem',
    margin: 0,
    overflowX: 'auto',
    fontFamily: "'Fira Code', monospace",
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
};