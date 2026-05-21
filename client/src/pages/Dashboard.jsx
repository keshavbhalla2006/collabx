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
  page: { minHeight: '100vh', background: '#f7f7fb', fontFamily: 'sans-serif' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: '60px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  navLogo: { fontSize: '1.4rem', fontWeight: '700', color: '#6c63ff' },
  navRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  navName: { fontWeight: '500', fontSize: '0.95rem', color: '#333' },
  avatar: { width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' },
  avatarFallback: { width: 36, height: 36, borderRadius: '50%', background: '#6c63ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.85rem' },
  logoutBtn: { padding: '0.35rem 0.9rem', border: '1px solid #ddd', borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: '#555' },
  main: { maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  heading: { fontSize: '1.4rem', fontWeight: '600', color: '#222', margin: 0 },
  btnGroup: { display: 'flex', gap: '0.75rem' },
  btnPrimary: { padding: '0.55rem 1.2rem', background: '#6c63ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' },
  btnSecondary: { padding: '0.55rem 1.2rem', background: '#fff', color: '#6c63ff', border: '1px solid #6c63ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' },
  formCard: { background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
  formTitle: { margin: '0 0 1rem', fontSize: '1rem', fontWeight: '600', color: '#333' },
  input: { display: 'block', width: '100%', padding: '0.7rem 1rem', marginBottom: '0.9rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  formBtns: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  error: { background: '#fff0f0', color: '#c0392b', padding: '0.6rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.15s', ':hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' } },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  cardName: { fontWeight: '600', fontSize: '1rem', color: '#222' },
  badgeHost: { fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#ede9fe', color: '#5b21b6', fontWeight: '600' },
  badgeMember: { fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '20px', background: '#e0f2fe', color: '#0369a1', fontWeight: '600' },
  cardMeta: { display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' },
  langPill: { fontSize: '0.78rem', padding: '0.18rem 0.6rem', borderRadius: '20px', background: '#f3f4f6', color: '#374151', fontWeight: '500' },
  inviteCode: { fontSize: '0.78rem', color: '#9ca3af', fontFamily: 'monospace' },
  cardHost: { fontSize: '0.82rem', color: '#6b7280', margin: 0 },
  emptyState: { textAlign: 'center', marginTop: '4rem' },
  emptyText: { fontSize: '1rem', color: '#888', margin: '0 0 0.5rem' },
};