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

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) =>
    name ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <div style={s.page}>

      {/* ── Navbar ── */}
      <nav style={s.nav}>
        <span style={s.navLogo}>CollabX</span>
        <div style={s.navRight}>
          <span style={s.navName}>{user?.name}</span>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" style={s.avatar} />
          ) : (
            <div style={s.avatarFallback}>{getInitials(user?.name)}</div>
          )}
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main style={s.main}>
        <div style={s.topRow}>
          <h2 style={s.heading}>Your Rooms</h2>
          <div style={s.btnGroup}>
            <button style={s.btnSecondary} onClick={() => { setShowJoin(true); setShowCreate(false); setError(''); }}>
              Join Room
            </button>
            <button style={s.btnPrimary} onClick={() => { setShowCreate(true); setShowJoin(false); setError(''); }}>
              + Create Room
            </button>
          </div>
        </div>

        {/* ── Create Room Form ── */}
        {showCreate && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Create a new room</h3>
            {error && <p style={s.error}>{error}</p>}
            <form onSubmit={handleCreate}>
              <input
                style={s.input}
                placeholder="Room name (e.g. Interview with Rahul)"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                required
              />
              <select
                style={s.input}
                value={createForm.language}
                onChange={(e) => setCreateForm({ ...createForm, language: e.target.value })}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
              </select>
              <div style={s.formBtns}>
                <button type="button" style={s.btnSecondary} onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" style={s.btnPrimary} disabled={actionLoading}>
                  {actionLoading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Join Room Form ── */}
        {showJoin && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Join a room</h3>
            {error && <p style={s.error}>{error}</p>}
            <form onSubmit={handleJoin}>
              <input
                style={s.input}
                placeholder="Enter invite code (e.g. aB3xK9mZ)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />
              <div style={s.formBtns}>
                <button type="button" style={s.btnSecondary} onClick={() => setShowJoin(false)}>Cancel</button>
                <button type="submit" style={s.btnPrimary} disabled={actionLoading}>
                  {actionLoading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Room Cards ── */}
        {loading ? (
          <p style={s.emptyText}>Loading your rooms...</p>
        ) : rooms.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyText}>No rooms yet.</p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Create one or join with an invite code.</p>
          </div>
        ) : (
          <div style={s.grid}>
            {rooms.map((room) => (
              <div
                key={room.id}
                style={s.card}
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div style={s.cardTop}>
                  <span style={s.cardName}>{room.name}</span>
                  <span style={room.role === 'host' ? s.badgeHost : s.badgeMember}>
                    {room.role}
                  </span>
                </div>
                <div style={s.cardMeta}>
                  <span style={s.langPill}>{room.language}</span>
                  <span style={s.inviteCode}>#{room.invite_code}</span>
                </div>
                <p style={s.cardHost}>Host: {room.host?.name || 'You'}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#090c11',
    fontFamily: "'Syne', sans-serif",
    color: '#e8ecf0',
  },

  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    height: '64px',
    background: 'rgba(8,11,15,0.95)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(10px)',
  },

  navLogo: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#d4af37',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
  },

  navName: {
    fontWeight: '600',
    fontSize: '0.85rem',
    color: '#c8cdd4',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid rgba(212,175,55,0.35)',
  },

  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'linear-gradient(135deg,#1a1f2e,#2a2f40)',
    border: '2px solid rgba(212,175,55,0.3)',
    color: '#d4af37',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '0.8rem',
    flexShrink: 0,
  },

  logoutBtn: {
    padding: '0.45rem 0.9rem',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.03)',
    color: '#8a9199',
    cursor: 'pointer',
    fontSize: '0.76rem',
    fontWeight: '700',
    fontFamily: "'Syne', sans-serif",
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'all 0.2s ease',
  },

  main: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '1.5rem 1rem 2rem',
  },

  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },

  heading: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f3f5f7',
    margin: 0,
    letterSpacing: '0.02em',
  },

  btnGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },

  btnPrimary: {
    padding: '0.7rem 1.2rem',

    background: `
      linear-gradient(
        135deg,
        rgba(212,175,55,0.15),
        rgba(212,175,55,0.08)
      )
    `,

    color: '#d4af37',

    border: '1px solid rgba(212,175,55,0.35)',

    borderRadius: '10px',

    cursor: 'pointer',

    fontWeight: '700',

    fontSize: '0.78rem',

    fontFamily: "'Syne', sans-serif",

    letterSpacing: '0.08em',

    textTransform: 'uppercase',

    transition: 'all 0.2s ease',
  },

  btnSecondary: {
    padding: '0.7rem 1.2rem',

    background: 'rgba(255,255,255,0.03)',

    color: '#8a9199',

    border: '1px solid rgba(255,255,255,0.08)',

    borderRadius: '10px',

    cursor: 'pointer',

    fontWeight: '700',

    fontSize: '0.78rem',

    fontFamily: "'Syne', sans-serif",

    letterSpacing: '0.08em',

    textTransform: 'uppercase',

    transition: 'all 0.2s ease',
  },

  formCard: {
    background: '#0e1218',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '1.25rem',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  },

  formTitle: {
    margin: '0 0 1rem',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },

  input: {
    display: 'block',

    width: '100%',

    padding: '0.8rem 1rem',

    marginBottom: '0.9rem',

    background: '#090c11',

    border: '1px solid rgba(255,255,255,0.08)',

    borderRadius: '10px',

    color: '#e8ecf0',

    fontSize: '0.92rem',

    boxSizing: 'border-box',

    outline: 'none',

    fontFamily: "'Syne', sans-serif",
  },

  formBtns: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },

  error: {
    background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)',
    color: '#f87171',
    padding: '0.7rem 1rem',
    borderRadius: '10px',
    marginBottom: '1rem',
    fontSize: '0.82rem',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },

  card: {
    background: '#0e1218',

    border: '1px solid rgba(255,255,255,0.06)',

    borderRadius: '16px',

    padding: '1.2rem',

    cursor: 'pointer',

    transition: 'all 0.2s ease',

    boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
  },

  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.9rem',
  },

  cardName: {
    fontWeight: '700',
    fontSize: '1rem',
    color: '#f3f5f7',
    lineHeight: 1.4,
  },

  badgeHost: {
    fontSize: '0.62rem',

    padding: '0.28rem 0.65rem',

    borderRadius: '999px',

    background: 'rgba(212,175,55,0.12)',

    border: '1px solid rgba(212,175,55,0.25)',

    color: '#d4af37',

    fontWeight: '700',

    letterSpacing: '0.08em',

    textTransform: 'uppercase',

    flexShrink: 0,
  },

  badgeMember: {
    fontSize: '0.62rem',

    padding: '0.28rem 0.65rem',

    borderRadius: '999px',

    background: 'rgba(255,255,255,0.05)',

    border: '1px solid rgba(255,255,255,0.08)',

    color: '#9ca3af',

    fontWeight: '700',

    letterSpacing: '0.08em',

    textTransform: 'uppercase',

    flexShrink: 0,
  },

  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    flexWrap: 'wrap',
    marginBottom: '0.8rem',
  },

  langPill: {
    fontSize: '0.68rem',

    padding: '0.22rem 0.65rem',

    borderRadius: '999px',

    background: 'rgba(212,175,55,0.08)',

    border: '1px solid rgba(212,175,55,0.18)',

    color: '#d4af37',

    fontWeight: '700',

    letterSpacing: '0.06em',

    textTransform: 'uppercase',
  },

  inviteCode: {
    fontSize: '0.72rem',
    color: '#6b7280',
    fontFamily: 'monospace',
  },

  cardHost: {
    fontSize: '0.78rem',
    color: '#8a9199',
    margin: 0,
    lineHeight: 1.5,
  },

  emptyState: {
    textAlign: 'center',
    marginTop: '5rem',
    padding: '1rem',
  },

  emptyText: {
    fontSize: '1rem',
    color: '#c8cdd4',
    margin: '0 0 0.5rem',
    fontWeight: '600',
  },
};
