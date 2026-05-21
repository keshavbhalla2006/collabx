import { useState, useEffect } from 'react';
import {
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiCpu,
} from 'react-icons/fi';

import { aiAPI, roomAPI } from '../services/api';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Trees',
  'Graphs',
  'Dynamic Programming',
  'Recursion',
  'Sorting',
  'Binary Search',
  'Stack and Queue',
  'Hash Maps',
  'Two Pointers',
  'Sliding Window',
];

const QUESTION_PANEL_STYLES = `
.qp-root{
  display:flex;
  flex-direction:column;
  height:100%;
  background:#090c11;
  font-family:'Syne',sans-serif;
  overflow:hidden;
  border-left:1px solid rgba(212,175,55,0.12);
}

.qp-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0.7rem 0.9rem;
  background:rgba(8,11,15,0.95);
  border-bottom:1px solid rgba(255,255,255,0.05);
  flex-shrink:0;
}

.qp-header-left{
  display:flex;
  align-items:center;
  gap:0.45rem;
}

.qp-title{
  color:#d4af37;
  font-size:0.78rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;
}

.qp-guest{
  color:#4a5260;
  font-size:0.68rem;
  text-transform:uppercase;
  letter-spacing:0.06em;
}

.qp-controls{
  display:flex;
  flex-direction:column;
  gap:0.55rem;
  padding:0.85rem;
  border-bottom:1px solid rgba(255,255,255,0.05);
  flex-shrink:0;
}

.qp-select{
  background:#0e1218;
  border:1px solid rgba(255,255,255,0.08);
  border-radius:8px;
  color:#d7dce2;
  padding:0.55rem 0.75rem;
  font-size:0.8rem;
  font-family:'Syne',sans-serif;
  outline:none;
  transition:all .2s;
}

.qp-select:focus{
  border-color:rgba(212,175,55,0.45);
  box-shadow:0 0 0 3px rgba(212,175,55,0.08);
}

.qp-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:0.45rem;

  background:linear-gradient(
    135deg,
    rgba(212,175,55,0.15),
    rgba(212,175,55,0.08)
  );

  border:1px solid rgba(212,175,55,0.35);
  color:#d4af37;

  border-radius:8px;
  padding:0.65rem;
  cursor:pointer;

  font-family:'Syne',sans-serif;
  font-size:0.76rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;

  transition:all .2s;
}

.qp-btn:hover{
  background:rgba(212,175,55,0.18);
  border-color:rgba(212,175,55,0.7);
  box-shadow:0 0 16px rgba(212,175,55,0.12);
}

.qp-error{
  background:rgba(220,38,38,0.08);
  border-bottom:1px solid rgba(220,38,38,0.2);
  color:#f87171;
  padding:0.6rem 0.8rem;
  font-size:0.72rem;
}

.qp-loading,
.qp-empty{
  flex:1;
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  gap:0.9rem;
  padding:2rem;
  text-align:center;
}

.qp-loading-text,
.qp-empty-text{
  color:#4a5260;
  font-size:0.78rem;
  line-height:1.6;
  max-width:260px;
}

.qp-dots{
  display:flex;
  gap:5px;
}

.qp-dot{
  color:#d4af37;
  font-size:1rem;
  animation:blink 1.2s infinite;
}

.qp-body{
  flex:1;
  overflow-y:auto;
  padding:0.9rem;
}

.qp-card{
  background:#0e1218;
  border:1px solid rgba(255,255,255,0.06);
  border-radius:12px;
  padding:1rem;
}

.qp-question-title{
  color:#f3f5f7;
  font-size:1rem;
  font-weight:700;
  line-height:1.4;
  margin:0 0 0.75rem;
}

.qp-meta{
  display:flex;
  gap:0.5rem;
  margin-bottom:1rem;
  flex-wrap:wrap;
}

.qp-badge{
  padding:0.22rem 0.55rem;
  border-radius:5px;
  font-size:0.65rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;
}

.qp-badge.diff{
  border:1px solid rgba(212,175,55,0.3);
  color:#d4af37;
  background:rgba(212,175,55,0.06);
}

.qp-badge.topic{
  border:1px solid rgba(255,255,255,0.08);
  color:#8a9199;
  background:rgba(255,255,255,0.03);
}

.qp-description{
  color:#cfd5dc;
  font-size:0.84rem;
  line-height:1.8;
}

.qp-section{
  margin-top:1rem;
}

.qp-section-label{
  color:#d4af37;
  font-size:0.68rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;
  margin-bottom:0.55rem;
}

.qp-example{
  background:#11161f;
  border:1px solid rgba(255,255,255,0.05);
  border-radius:10px;
  padding:0.85rem;
  margin-top:0.75rem;
}

.qp-example-title{
  color:#d4af37;
  font-size:0.68rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;
  margin-bottom:0.55rem;
}

.qp-line{
  margin:0.3rem 0;
  color:#cfd5dc;
  font-size:0.78rem;
  line-height:1.6;
}

.qp-code{
  background:#0b0f14;
  border:1px solid rgba(212,175,55,0.08);
  color:#f5d97b;
  padding:0.14rem 0.45rem;
  border-radius:5px;
  font-size:0.76rem;
  font-family:'Fira Code',monospace;
}

.qp-collapse{
  display:flex;
  align-items:center;
  gap:0.35rem;

  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.08);

  color:#8a9199;

  border-radius:7px;
  padding:0.45rem 0.7rem;
  cursor:pointer;

  font-size:0.74rem;
  font-family:'Syne',sans-serif;
  transition:all .2s;
}

.qp-collapse:hover{
  border-color:rgba(212,175,55,0.25);
  color:#d4af37;
}

.qp-list{
  margin-top:0.75rem;
  padding-left:1.2rem;
}

.qp-list li{
  color:#cfd5dc;
  font-size:0.8rem;
  margin-bottom:0.45rem;
  line-height:1.6;
}

.qp-starter{
  margin-top:0.75rem;
  display:flex;
  flex-direction:column;
  gap:0.75rem;
}

.qp-starter-block{
  background:#11161f;
  border:1px solid rgba(255,255,255,0.05);
  border-radius:10px;
  overflow:hidden;
}

.qp-starter-label{
  background:#0b0f14;
  border-bottom:1px solid rgba(255,255,255,0.05);
  color:#d4af37;
  padding:0.55rem 0.8rem;
  font-size:0.7rem;
  font-weight:700;
  letter-spacing:0.08em;
  text-transform:uppercase;
}

.qp-pre{
  margin:0;
  padding:0.9rem;
  overflow-x:auto;
  color:#d7dce2;
  font-size:0.76rem;
  line-height:1.6;
  font-family:'Fira Code',monospace;
  white-space:pre-wrap;
}

@keyframes spin{
  to{transform:rotate(360deg)}
}

@keyframes blink{
  0%,100%{opacity:.25}
  50%{opacity:1}
}
`;

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

  useEffect(() => {
    if (!roomId) return;

    const loadQuestion = async () => {
      try {
        const res = await roomAPI.getRoom(roomId);

        const savedQuestion =
          res.data.room?.current_question;

        if (savedQuestion) {
          const parsed =
            typeof savedQuestion === 'string'
              ? JSON.parse(savedQuestion)
              : savedQuestion;

          setQuestion(parsed);
        }
      } catch (err) {
        console.error(
          'Failed to load saved question:',
          err
        );
      }
    };

    loadQuestion();
  }, [roomId]);

  useEffect(() => {
    if (externalQuestion) {
      setQuestion(externalQuestion);

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

      socket?.emit('question-loaded', {
        roomId,
        question: q,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to generate question. Try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{QUESTION_PANEL_STYLES}</style>

      <div className="qp-root">

        {/* Header */}

        <div className="qp-header">
          <div className="qp-header-left">
            <FiCpu size={14} color="#d4af37" />

            <span className="qp-title">
              AI Question Engine
            </span>
          </div>

          {!isHost && question && (
            <span className="qp-guest">
              loaded by host
            </span>
          )}
        </div>

        {/* Controls */}

        {isHost && (
          <div className="qp-controls">

            <select
              className="qp-select"
              value={topic}
              onChange={(e) =>
                setTopic(e.target.value)
              }
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              className="qp-select"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value)
              }
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <button
              className="qp-btn"
              onClick={handleGenerate}
              disabled={loading}
              style={{
                opacity: loading ? 0.7 : 1,
              }}
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

        {error && (
          <div className="qp-error">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading && (
          <div className="qp-loading">
            <FiCpu size={30} color="#d4af37" />

            <p className="qp-loading-text">
              Grok is generating your question...
            </p>

            <div className="qp-dots">
              <span className="qp-dot">●</span>

              <span
                className="qp-dot"
                style={{ animationDelay: '0.2s' }}
              >
                ●
              </span>

              <span
                className="qp-dot"
                style={{ animationDelay: '0.4s' }}
              >
                ●
              </span>
            </div>
          </div>
        )}

        {/* Empty */}

        {!question && !loading && (
          <div className="qp-empty">
            <FiCpu size={34} color="#d4af37" />

            <p className="qp-empty-text">
              {isHost
                ? 'Select a topic and difficulty, then generate a question.'
                : 'Waiting for the host to load a question...'}
            </p>
          </div>
        )}

        {/* Question */}

        {question && !loading && (
          <div className="qp-body">
            <div className="qp-card">

              <h2 className="qp-question-title">
                {question.title}
              </h2>

              <div className="qp-meta">

                <span className="qp-badge diff">
                  {question.difficulty}
                </span>

                <span className="qp-badge topic">
                  {question.topic}
                </span>

              </div>

              <p className="qp-description">
                {question.description}
              </p>

              {/* Examples */}

              {question.examples?.map((ex, i) => (
                <div
                  key={i}
                  className="qp-example"
                >
                  <div className="qp-example-title">
                    Example {i + 1}
                  </div>

                  <p className="qp-line">
                    <strong>Input:</strong>{' '}
                    <code className="qp-code">
                      {ex.input}
                    </code>
                  </p>

                  <p className="qp-line">
                    <strong>Output:</strong>{' '}
                    <code className="qp-code">
                      {ex.output}
                    </code>
                  </p>

                  {ex.explanation && (
                    <p className="qp-line">
                      <strong>Explanation:</strong>{' '}
                      {ex.explanation}
                    </p>
                  )}
                </div>
              ))}

              {/* Constraints */}

              {question.constraints?.length > 0 && (
                <div className="qp-section">

                  <div className="qp-section-label">
                    Constraints
                  </div>

                  <ul className="qp-list">
                    {question.constraints.map(
                      (c, i) => (
                        <li key={i}>
                          <code className="qp-code">
                            {c}
                          </code>
                        </li>
                      )
                    )}
                  </ul>

                </div>
              )}

              {/* Hints */}

              {question.hints?.length > 0 && (
                <div className="qp-section">

                  <button
                    className="qp-collapse"
                    onClick={() =>
                      setShowHints(!showHints)
                    }
                  >
                    {showHints
                      ? <FiChevronUp size={14} />
                      : <FiChevronDown size={14} />}

                    {showHints
                      ? 'Hide Hints'
                      : `Show Hints (${question.hints.length})`}
                  </button>

                  {showHints && (
                    <ol className="qp-list">
                      {question.hints.map(
                        (h, i) => (
                          <li key={i}>
                            {h}
                          </li>
                        )
                      )}
                    </ol>
                  )}

                </div>
              )}

              {/* Starter Code */}

              {question.starterCode && (
                <div className="qp-section">

                  <button
                    className="qp-collapse"
                    onClick={() =>
                      setShowStarter(!showStarter)
                    }
                  >
                    {showStarter
                      ? <FiChevronUp size={14} />
                      : <FiChevronDown size={14} />}

                    {showStarter
                      ? 'Hide Starter Code'
                      : 'Show Starter Code'}
                  </button>

                  {showStarter && (
                    <div className="qp-starter">

                      {Object.entries(
                        question.starterCode
                      ).map(([lang, code]) => (

                        <div
                          key={lang}
                          className="qp-starter-block"
                        >

                          <div className="qp-starter-label">
                            {lang}
                          </div>

                          <pre className="qp-pre">
                            {code}
                          </pre>

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </>
  );
}
