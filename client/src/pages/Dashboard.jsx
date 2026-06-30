import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roomAPI } from '../services/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', language: 'javascript' });
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  useEffect(() => { fetchRooms(); }, []);

  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getMyRooms();
      setRooms(res.data.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      const res = await roomAPI.create(createForm);
      setRooms((prev) => [{ ...res.data.room, role: 'host' }, ...prev]);
      setShowCreate(false);
      setCreateForm({ name: '', language: 'javascript' });
      navigate(`/room/${res.data.room.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');
    setActionLoading(true);
    try {
      const res = await roomAPI.join(joinCode.trim());
      navigate(`/room/${res.data.room.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const LANGS = ['javascript', 'python', 'java', 'cpp', 'typescript'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; }

        .db-page {
          min-height: 100vh;
          background: #060810;
          font-family: 'Syne', sans-serif;
          color: #e8ecf0;
        }

        /* ── NAV ── */
        .db-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(1rem, 3vw, 2.5rem);
          height: 64px;
          background: rgba(6,8,16,0.92);
          border-bottom: 1px solid rgba(212,175,55,0.08);
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(12px);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .nav-brand-icon {
          width: 32px;
          height: 32px;
          border: 1.5px solid rgba(212,175,55,0.4);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,175,55,0.06);
          flex-shrink: 0;
        }

        .nav-logo {
          font-size: 1.1rem;
          font-weight: 800;
          color: #d4af37;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .nav-name {
          font-weight: 600;
          font-size: 0.82rem;
          color: #8a9199;
          max-width: 130px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 480px) { .nav-name { display: none; } }

        .nav-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(212,175,55,0.3);
          flex-shrink: 0;
        }

        .nav-avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #111620, #1c2130);
          border: 2px solid rgba(212,175,55,0.28);
          color: #d4af37;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.75rem;
          flex-shrink: 0;
          letter-spacing: 0.04em;
        }

        .nav-logout {
          padding: 0.42rem 0.85rem;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          color: #4a5568;
          cursor: pointer;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .nav-logout:hover {
          color: #f87171;
          border-color: rgba(248,113,113,0.2);
          background: rgba(248,113,113,0.04);
        }

        /* ── MAIN ── */
        .db-main {
          max-width: 1140px;
          margin: 0 auto;
          padding: clamp(1.5rem, 4vw, 2.5rem) clamp(1rem, 3vw, 2rem) 4rem;
        }

        /* ── PAGE HEADER ── */
        .db-page-header {
          margin-bottom: 2rem;
          animation: fadeUp 0.5s ease both;
        }

        .db-page-eyebrow {
          font-size: 0.68rem;
          font-weight: 700;
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          opacity: 0.7;
        }

        .db-page-eyebrow::before {
          content: '';
          display: block;
          width: 20px;
          height: 1px;
          background: #d4af37;
        }

        .db-page-title {
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: #f0f2f5;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .db-page-title span { color: #d4af37; }

        /* ── TOP ROW ── */
        .db-top-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.07s;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.1rem;
          background: linear-gradient(135deg, rgba(212,175,55,0.16), rgba(212,175,55,0.07));
          color: #d4af37;
          border: 1px solid rgba(212,175,55,0.35);
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.73rem;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.1));
          opacity: 0;
          transition: opacity 0.2s;
        }

        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:hover {
          border-color: rgba(212,175,55,0.55);
          box-shadow: 0 4px 18px rgba(212,175,55,0.1);
          transform: translateY(-1px);
        }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-primary span { position: relative; z-index: 1; }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.1rem;
          background: rgba(255,255,255,0.02);
          color: #8a9199;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.73rem;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.12);
          color: #c8cdd4;
        }

        /* ── FORM PANEL ── */
        .form-panel {
          background: #0b0e16;
          border: 1px solid rgba(212,175,55,0.1);
          border-radius: 18px;
          padding: clamp(1.25rem, 3vw, 2rem);
          margin-bottom: 2rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(212,175,55,0.05);
          animation: fadeUp 0.35s ease both;
          position: relative;
          overflow: hidden;
        }

        .form-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent);
        }

        .form-panel-title {
          font-size: 0.72rem;
          font-weight: 800;
          color: #d4af37;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .form-panel-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(212,175,55,0.1);
        }

        .panel-field {
          position: relative;
          margin-bottom: 1rem;
        }

        .panel-label {
          display: block;
          font-size: 0.67rem;
          font-weight: 700;
          color: #3d4553;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.4rem;
          transition: color 0.2s;
        }

        .panel-field.focused .panel-label { color: #d4af37; }

        .panel-input-wrap { position: relative; }

        .panel-field-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          width: 15px;
          height: 15px;
          color: #2a303a;
          pointer-events: none;
          transition: color 0.2s;
        }

        .panel-field.focused .panel-field-icon { color: #d4af37; }

        .panel-input {
          display: block;
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.6rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 11px;
          color: #e8ecf0;
          font-size: 0.9rem;
          font-family: 'Syne', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .panel-input::placeholder { color: #1e242e; }

        .panel-input:focus {
          border-color: rgba(212,175,55,0.35);
          background: rgba(212,175,55,0.025);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.05);
        }

        .panel-select {
          display: block;
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.6rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 11px;
          color: #e8ecf0;
          font-size: 0.9rem;
          font-family: 'Syne', sans-serif;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233d4553' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }

        .panel-select:focus {
          border-color: rgba(212,175,55,0.35);
          background-color: rgba(212,175,55,0.025);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.05);
        }

        .panel-select option { background: #0b0e16; color: #e8ecf0; }

        .field-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          border-radius: 0 0 11px 11px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .panel-field.focused .field-bottom-bar { opacity: 1; }

        .panel-btns {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          flex-wrap: wrap;
          margin-top: 1.25rem;
        }

        .btn-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(212,175,55,0.25);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── ERROR ── */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.16);
          color: #f87171;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.8rem;
          line-height: 1.5;
        }

        .error-icon { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; }

        /* ── STATS BAR ── */
        .stats-bar {
          display: flex;
          gap: 1px;
          margin-bottom: 2rem;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.05);
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.1s;
        }

        .stat-cell {
          flex: 1;
          padding: 1rem 1.25rem;
          background: #0b0e16;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .stat-cell + .stat-cell { border-left: 1px solid rgba(255,255,255,0.04); }

        .stat-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: #d4af37;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .stat-lbl {
          font-size: 0.65rem;
          font-weight: 700;
          color: #2e3540;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        @media (max-width: 500px) {
          .stats-bar { flex-direction: column; }
          .stat-cell + .stat-cell { border-left: none; border-top: 1px solid rgba(255,255,255,0.04); }
        }

        /* ── SECTION LABEL ── */
        .section-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #3d4553;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.14s;
        }

        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.04);
        }

        /* ── GRID ── */
        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.18s;
        }

        /* ── ROOM CARD ── */
        .room-card {
          background: #0b0e16;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 1.35rem;
          cursor: pointer;
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
        }

        .room-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(212,175,55,0.04), transparent 60%);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .room-card:hover {
          border-color: rgba(212,175,55,0.2);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(212,175,55,0.08);
        }

        .room-card:hover::before { opacity: 1; }
        .room-card:active { transform: translateY(0); }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .card-name {
          font-weight: 700;
          font-size: 1rem;
          color: #f0f2f5;
          line-height: 1.35;
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }

        .badge-host {
          font-size: 0.58rem;
          padding: 0.26rem 0.6rem;
          border-radius: 999px;
          background: rgba(212,175,55,0.1);
          border: 1px solid rgba(212,175,55,0.22);
          color: #d4af37;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .badge-member {
          font-size: 0.58rem;
          padding: 0.26rem 0.6rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #6b7280;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
          margin-bottom: 0.9rem;
        }

        .lang-pill {
          font-size: 0.63rem;
          padding: 0.22rem 0.6rem;
          border-radius: 999px;
          background: rgba(212,175,55,0.07);
          border: 1px solid rgba(212,175,55,0.15);
          color: #d4af37;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .invite-code {
          font-size: 0.7rem;
          color: #2e3540;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.06em;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding-top: 0.85rem;
          border-top: 1px solid rgba(255,255,255,0.04);
        }

        .card-host-label {
          font-size: 0.74rem;
          color: #3d4553;
          font-weight: 500;
        }

        .card-arrow {
          width: 16px;
          height: 16px;
          color: #2a303a;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .room-card:hover .card-arrow {
          color: #d4af37;
          transform: translateX(2px);
        }

        /* ── EMPTY ── */
        .empty-state {
          text-align: center;
          padding: 5rem 2rem;
          animation: fadeUp 0.5s ease both;
          animation-delay: 0.18s;
        }

        .empty-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 1.25rem;
          border: 1px solid rgba(212,175,55,0.12);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,175,55,0.04);
          color: #d4af37;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 0.4rem;
          letter-spacing: 0.02em;
        }

        .empty-sub {
          font-size: 0.82rem;
          color: #2e3540;
          line-height: 1.6;
        }

        /* ── LOADING SHIMMER ── */
        .shimmer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          animation: fadeUp 0.5s ease both;
        }

        .shimmer-card {
          background: #0b0e16;
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 16px;
          padding: 1.35rem;
          height: 140px;
          position: relative;
          overflow: hidden;
        }

        .shimmer-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.02), transparent);
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .db-nav { animation: fadeIn 0.4s ease both; }
      `}</style>

      <div className="db-page">

        {/* ── NAV ── */}
        <nav className="db-nav">
          <div className="nav-brand">
            <div className="nav-brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="nav-logo">CollabX</span>
          </div>

          <div className="nav-right">
            <span className="nav-name">{user?.name}</span>
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="avatar" className="nav-avatar" />
            ) : (
              <div className="nav-avatar-fallback">{getInitials(user?.name)}</div>
            )}
            <button className="nav-logout" onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ── MAIN ── */}
        <main className="db-main">

          {/* Page header */}
          <div className="db-page-header">
            <div className="db-page-eyebrow">Workspace</div>
            <h1 className="db-page-title">
              {user?.name ? `Hey, ${user.name.split(' ')[0]}` : 'Dashboard'}<span>.</span>
            </h1>
          </div>

          {/* Action buttons */}
          <div className="db-top-row">
            <button
              className="btn-secondary"
              onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>Join Room</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span>Create Room</span>
            </button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="form-panel">
              <div className="form-panel-title">New Room</div>
              {error && (
                <div className="error-box">
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
              <form onSubmit={handleCreate}>
                <div className={`panel-field${focusedField === 'rname' ? ' focused' : ''}`}>
                  <label className="panel-label">Room name</label>
                  <div className="panel-input-wrap">
                    <svg className="panel-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <input
                      className="panel-input"
                      placeholder="e.g. Interview with Rahul"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      onFocus={() => setFocusedField('rname')}
                      onBlur={() => setFocusedField('')}
                      required
                    />
                    <div className="field-bottom-bar" />
                  </div>
                </div>

                <div className={`panel-field${focusedField === 'lang' ? ' focused' : ''}`}>
                  <label className="panel-label">Language</label>
                  <div className="panel-input-wrap">
                    <svg className="panel-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                    <select
                      className="panel-select"
                      value={createForm.language}
                      onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
                      onFocus={() => setFocusedField('lang')}
                      onBlur={() => setFocusedField('')}
                    >
                      {LANGS.map((l) => (
                        <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="panel-btns">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={actionLoading}>
                    <span>{actionLoading && <span className="btn-spinner" style={{display:'inline-block', marginRight:'0.4rem', verticalAlign:'middle'}}/>}</span>
                    <span>{actionLoading ? 'Creating…' : 'Create Room'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Join form */}
          {showJoin && (
            <div className="form-panel">
              <div className="form-panel-title">Join a Room</div>
              {error && (
                <div className="error-box">
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}
              <form onSubmit={handleJoin}>
                <div className={`panel-field${focusedField === 'code' ? ' focused' : ''}`}>
                  <label className="panel-label">Invite code</label>
                  <div className="panel-input-wrap">
                    <svg className="panel-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      className="panel-input"
                      placeholder="e.g. aB3xK9mZ"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onFocus={() => setFocusedField('code')}
                      onBlur={() => setFocusedField('')}
                      required
                      style={{ fontFamily: "'Courier New', monospace", letterSpacing: '0.1em' }}
                    />
                    <div className="field-bottom-bar" />
                  </div>
                </div>
                <div className="panel-btns">
                  <button type="button" className="btn-secondary" onClick={() => setShowJoin(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={actionLoading}>
                    <span>{actionLoading && <span className="btn-spinner" style={{display:'inline-block', marginRight:'0.4rem', verticalAlign:'middle'}}/>}</span>
                    <span>{actionLoading ? 'Joining…' : 'Join Room'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stats bar */}
          {!loading && rooms.length > 0 && (
            <div className="stats-bar">
              <div className="stat-cell">
                <span className="stat-val">{rooms.length}</span>
                <span className="stat-lbl">Total Rooms</span>
              </div>
              <div className="stat-cell">
                <span className="stat-val">{rooms.filter(r => r.role === 'host').length}</span>
                <span className="stat-lbl">Hosting</span>
              </div>
              <div className="stat-cell">
                <span className="stat-val">{rooms.filter(r => r.role !== 'host').length}</span>
                <span className="stat-lbl">Joined</span>
              </div>
            </div>
          )}

          {/* Section label */}
          {!loading && rooms.length > 0 && (
            <div className="section-label">Your Rooms</div>
          )}

          {/* Rooms */}
          {loading ? (
            <div className="shimmer-grid">
              {[1,2,3].map(i => <div key={i} className="shimmer-card" />)}
            </div>
          ) : rooms.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <p className="empty-title">No rooms yet</p>
              <p className="empty-sub">Create a room or join one with an invite code.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="room-card"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div className="card-top">
                    <span className="card-name">{room.name}</span>
                    <span className={room.role === 'host' ? 'badge-host' : 'badge-member'}>
                      {room.role}
                    </span>
                  </div>
                  <div className="card-meta">
                    <span className="lang-pill">{room.language}</span>
                    <span className="invite-code">#{room.invite_code}</span>
                  </div>
                  <div className="card-footer">
                    <span className="card-host-label">
                      Host: {room.host?.name || 'You'}
                    </span>
                    <svg className="card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
