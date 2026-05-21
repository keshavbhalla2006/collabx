import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', form);
      login(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>CollabX</h1>
        <h2 style={styles.title}>Create your account</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
          <input style={styles.input} type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input style={styles.input} type="password" name="password" placeholder="Password (min 6 chars)" value={form.password} onChange={handleChange} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div style={styles.divider}><span>or</span></div>

        <a
  style={styles.googleBtn}
  href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
>
  Continue with Google
</a>

       <p style={styles.footer}>
  Already have an account?{' '}
  <Link
    to="/login"
    style={{
      color: '#d4af37',
      textDecoration: 'none',
      fontWeight: '700',
    }}
  >
    Sign in
  </Link>
</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    padding: '1rem',

    background: `
      radial-gradient(
        circle at top,
        rgba(212,175,55,0.08),
        transparent 35%
      ),
      #090c11
    `,

    fontFamily: "'Syne', sans-serif",
  },

  card: {
    width: '100%',

    maxWidth: '420px',

    background: '#0e1218',

    border: '1px solid rgba(255,255,255,0.06)',

    borderRadius: '20px',

    padding: '2rem',

    boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
  },

  logo: {
    textAlign: 'center',

    fontSize: '1.8rem',

    fontWeight: '800',

    marginBottom: '0.35rem',

    color: '#d4af37',

    letterSpacing: '0.08em',

    textTransform: 'uppercase',
  },

  title: {
    textAlign: 'center',

    fontSize: '0.92rem',

    fontWeight: '600',

    marginBottom: '1.8rem',

    color: '#8a9199',

    letterSpacing: '0.06em',

    textTransform: 'uppercase',
  },

  input: {
    display: 'block',

    width: '100%',

    padding: '0.9rem 1rem',

    marginBottom: '1rem',

    background: '#090c11',

    border: '1px solid rgba(255,255,255,0.08)',

    borderRadius: '12px',

    color: '#e8ecf0',

    fontSize: '0.95rem',

    boxSizing: 'border-box',

    outline: 'none',

    fontFamily: "'Syne', sans-serif",

    transition: 'all 0.2s ease',
  },

  btn: {
    width: '100%',

    padding: '0.9rem',

    background: `
      linear-gradient(
        135deg,
        rgba(212,175,55,0.15),
        rgba(212,175,55,0.08)
      )
    `,

    color: '#d4af37',

    border: '1px solid rgba(212,175,55,0.35)',

    borderRadius: '12px',

    fontSize: '0.82rem',

    cursor: 'pointer',

    fontWeight: '700',

    fontFamily: "'Syne', sans-serif",

    letterSpacing: '0.08em',

    textTransform: 'uppercase',

    transition: 'all 0.2s ease',
  },

  googleBtn: {
    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    width: '100%',

    padding: '0.9rem',

    border: '1px solid rgba(255,255,255,0.08)',

    borderRadius: '12px',

    textAlign: 'center',

    textDecoration: 'none',

    background: 'rgba(255,255,255,0.03)',

    color: '#c8cdd4',

    fontSize: '0.85rem',

    fontWeight: '600',

    marginTop: '0.75rem',

    boxSizing: 'border-box',

    transition: 'all 0.2s ease',
  },

  divider: {
    textAlign: 'center',

    margin: '1.4rem 0',

    color: '#4a5260',

    fontSize: '0.78rem',

    position: 'relative',

    textTransform: 'uppercase',

    letterSpacing: '0.08em',
  },

  error: {
    background: 'rgba(220,38,38,0.08)',

    border: '1px solid rgba(220,38,38,0.2)',

    color: '#f87171',

    padding: '0.75rem 1rem',

    borderRadius: '10px',

    marginBottom: '1rem',

    fontSize: '0.82rem',

    lineHeight: 1.5,
  },

  footer: {
    textAlign: 'center',

    marginTop: '1.5rem',

    fontSize: '0.82rem',

    color: '#6b7280',

    lineHeight: 1.6,
  },
};
