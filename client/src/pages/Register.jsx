import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', form);

      login(res.data.user, res.data.token);

      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Registration failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.wrapper}>
        <div style={styles.left}>
          <p style={styles.brandTag}>
            GOLD • OBSIDIAN • COLLAB
          </p>

          <h1 style={styles.heroTitle}>
            Build.
            <br />
            Collaborate.
            <br />
            Ship Faster.
          </h1>

          <p style={styles.heroText}>
            Create collaborative coding rooms with
            real-time chat, AI interview questions,
            live coding, and video collaboration.
          </p>
        </div>

        <div style={styles.right}>
          <div style={styles.card}>
            <h1 style={styles.logo}>CollabX</h1>

            <h2 style={styles.title}>
              Create your account
            </h2>

            {error && (
              <p style={styles.error}>
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <input
                style={styles.input}
                type="text"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Password (min 6 chars)"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                style={styles.btn}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Creating account...'
                  : 'Create account'}
              </button>
            </form>

            <div style={styles.divider}>
              <span>or</span>
            </div>

            <a
              style={styles.googleBtn}
              href={`${
                import.meta.env.VITE_API_URL ||
                'http://localhost:5000'
              }/api/auth/google`}
            >
              Continue with Google
            </a>

            <p style={styles.footer}>
              Already have an account?{' '}
              <Link
                to="/login"
                style={styles.link}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    background:
      'linear-gradient(135deg, #05070a 0%, #090c11 40%, #0d1117 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Syne', sans-serif",
  },

  bgGlow1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background:
      'rgba(212,175,55,0.08)',
    filter: 'blur(120px)',
    top: '-180px',
    left: '-120px',
  },

  bgGlow2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background:
      'rgba(212,175,55,0.05)',
    filter: 'blur(120px)',
    bottom: '-150px',
    right: '-100px',
  },

  wrapper: {
    position: 'relative',
    zIndex: 2,
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
  },

  left: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '4rem',
  },

  brandTag: {
    color: '#d4af37',
    fontSize: '0.8rem',
    letterSpacing: '0.22em',
    marginBottom: '1.2rem',
    fontWeight: '700',
  },

  heroTitle: {
    color: '#f3f4f6',
    fontSize: '4.5rem',
    lineHeight: '0.95',
    margin: 0,
    fontWeight: '800',
    letterSpacing: '-0.05em',
  },

  heroText: {
    marginTop: '1.8rem',
    color: '#7b8494',
    fontSize: '1rem',
    maxWidth: '520px',
    lineHeight: '1.8',
  },

  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },

  card: {
    width: '100%',
    maxWidth: '420px',
    background:
      'rgba(10,14,20,0.88)',
    backdropFilter: 'blur(18px)',
    border:
      '1px solid rgba(212,175,55,0.14)',
    borderRadius: '24px',
    padding: '2.5rem',
    boxShadow:
      '0 0 40px rgba(0,0,0,0.45)',
  },

  logo: {
    color: '#d4af37',
    fontSize: '2rem',
    margin: 0,
    marginBottom: '0.4rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
  },

  title: {
    color: '#e5e7eb',
    fontSize: '1rem',
    fontWeight: '500',
    marginBottom: '2rem',
  },

  input: {
    width: '100%',
    padding: '0.95rem 1rem',
    marginBottom: '1rem',
    background: '#0f141b',
    border:
      '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#f3f4f6',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
  },

  btn: {
    width: '100%',
    padding: '0.95rem',
    background:
      'linear-gradient(135deg,#d4af37,#f4d06f)',
    color: '#090c11',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '0.4rem',
    transition: '0.2s',
  },

  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0.9rem',
    borderRadius: '12px',
    textDecoration: 'none',
    background:
      'rgba(255,255,255,0.04)',
    border:
      '1px solid rgba(255,255,255,0.08)',
    color: '#d1d5db',
    fontWeight: '600',
    boxSizing: 'border-box',
  },

  divider: {
    textAlign: 'center',
    margin: '1.2rem 0',
    color: '#5c6472',
    fontSize: '0.82rem',
  },

  error: {
    background:
      'rgba(220,38,38,0.12)',
    border:
      '1px solid rgba(220,38,38,0.25)',
    color: '#f87171',
    padding: '0.8rem 1rem',
    borderRadius: '12px',
    marginBottom: '1rem',
    fontSize: '0.88rem',
  },

  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    color: '#7b8494',
    fontSize: '0.9rem',
  },

  link: {
    color: '#d4af37',
    textDecoration: 'none',
    fontWeight: '700',
  },
};
