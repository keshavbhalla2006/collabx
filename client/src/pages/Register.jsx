import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body, #root {
          height: 100%;
          width: 100%;
        }

        .reg-page {
          min-height: 100vh;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Syne', sans-serif;
          background: #060810;
          overflow: hidden;
          position: relative;
        }

        /* ── LEFT PANEL ── */
        .reg-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: clamp(2rem, 5vw, 4rem);
          overflow: hidden;
          background: #07090f;
          border-right: 1px solid rgba(212,175,55,0.08);
        }

        .left-noise {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 0;
        }

        .left-glow-top {
          position: absolute;
          top: -120px;
          left: -80px;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .left-glow-bottom {
          position: absolute;
          bottom: -100px;
          right: -60px;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .left-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(212,175,55,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,175,55,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }

        .left-top {
          position: relative;
          z-index: 1;
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-icon {
          width: 38px;
          height: 38px;
          border: 1.5px solid rgba(212,175,55,0.5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(212,175,55,0.06);
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #d4af37;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .left-center {
          position: relative;
          z-index: 1;
        }

        .left-tagline {
          font-size: clamp(2rem, 3.5vw, 3.2rem);
          font-weight: 800;
          line-height: 1.12;
          color: #e8ecf0;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
        }

        .left-tagline em {
          font-style: normal;
          background: linear-gradient(135deg, #d4af37, #f5d97e, #b8941f);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-sub {
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.7;
          max-width: 340px;
          font-weight: 400;
        }

        /* Steps / perks */
        .left-perks {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .perk-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .perk-dot {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid rgba(212,175,55,0.25);
          background: rgba(212,175,55,0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .perk-dot svg {
          width: 13px;
          height: 13px;
          stroke: #d4af37;
        }

        .perk-text strong {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #c8cdd4;
          letter-spacing: 0.02em;
          margin-bottom: 0.15rem;
        }

        .perk-text span {
          font-size: 0.75rem;
          color: #3d4553;
          line-height: 1.5;
        }

        /* ── RIGHT PANEL ── */
        .reg-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1.5rem, 5vw, 3rem);
          background: #060810;
          position: relative;
          overflow: hidden;
        }

        .right-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(212,175,55,0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }

        .form-header {
          margin-bottom: 2.5rem;
        }

        .form-eyebrow {
          font-size: 0.7rem;
          font-weight: 700;
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .form-eyebrow::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #d4af37;
          opacity: 0.6;
        }

        .form-title {
          font-size: clamp(1.8rem, 3vw, 2.4rem);
          font-weight: 800;
          color: #e8ecf0;
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .form-title span {
          color: #d4af37;
        }

        /* Error */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          background: rgba(220,38,38,0.06);
          border: 1px solid rgba(220,38,38,0.18);
          color: #f87171;
          padding: 0.8rem 1rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          font-size: 0.82rem;
          line-height: 1.5;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        /* Fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .field-wrap {
          position: relative;
        }

        .field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 0.45rem;
          transition: color 0.2s;
        }

        .field-wrap.focused .field-label {
          color: #d4af37;
        }

        .field-input-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #3d4553;
          pointer-events: none;
          transition: color 0.2s;
        }

        .field-wrap.focused .field-icon {
          color: #d4af37;
        }

        .field-input {
          display: block;
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.8rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          color: #e8ecf0;
          font-size: 0.93rem;
          font-family: 'Syne', sans-serif;
          outline: none;
          transition: all 0.2s ease;
        }

        .field-input::placeholder {
          color: #2a303a;
        }

        .field-input:focus {
          border-color: rgba(212,175,55,0.4);
          background: rgba(212,175,55,0.03);
          box-shadow: 0 0 0 3px rgba(212,175,55,0.06), inset 0 1px 2px rgba(0,0,0,0.3);
        }

        .field-bottom-line {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
          border-radius: 0 0 12px 12px;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .field-wrap.focused .field-bottom-line {
          opacity: 1;
        }

        /* Password hint */
        .pw-hint {
          margin-top: 0.4rem;
          font-size: 0.7rem;
          color: #2e3540;
          letter-spacing: 0.04em;
          padding-left: 0.2rem;
        }

        /* Terms */
        .terms-note {
          font-size: 0.72rem;
          color: #2e3540;
          line-height: 1.6;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .terms-note a {
          color: #4a5568;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
        }

        .terms-note a:hover {
          color: #d4af37;
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          padding: 0.95rem;
          background: linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.08));
          color: #d4af37;
          border: 1px solid rgba(212,175,55,0.35);
          border-radius: 12px;
          font-size: 0.78rem;
          font-weight: 800;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.12));
          opacity: 0;
          transition: opacity 0.25s;
        }

        .submit-btn:hover:not(:disabled)::before {
          opacity: 1;
        }

        .submit-btn:hover:not(:disabled) {
          border-color: rgba(212,175,55,0.6);
          box-shadow: 0 4px 24px rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.1);
          transform: translateY(-1px);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-inner {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(212,175,55,0.3);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.05);
        }

        .divider-text {
          font-size: 0.68rem;
          font-weight: 700;
          color: #2a303a;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        /* Google button */
        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          width: 100%;
          padding: 0.875rem;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          text-decoration: none;
          background: rgba(255,255,255,0.02);
          color: #8a9199;
          font-size: 0.82rem;
          font-weight: 600;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.05em;
          transition: all 0.2s ease;
          margin-bottom: 2rem;
        }

        .google-btn:hover {
          border-color: rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: #c8cdd4;
        }

        .google-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        /* Footer */
        .form-footer {
          text-align: center;
          font-size: 0.8rem;
          color: #2e3540;
          font-weight: 500;
        }

        .form-footer a {
          color: #d4af37;
          text-decoration: none;
          font-weight: 700;
          transition: opacity 0.2s;
        }

        .form-footer a:hover {
          opacity: 0.8;
        }

        /* ── MOBILE ── */
        @media (max-width: 768px) {
          .reg-page {
            grid-template-columns: 1fr;
          }

          .reg-left {
            display: none;
          }

          .reg-right {
            min-height: 100vh;
            padding: 2rem 1.25rem;
            align-items: flex-start;
            padding-top: 3rem;
          }

          .form-container {
            max-width: 100%;
          }
        }

        /* ── ENTRY ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .form-header  { animation: fadeUp 0.5s ease both; animation-delay: 0.05s; }
        .field-group  { animation: fadeUp 0.5s ease both; animation-delay: 0.12s; }
        .terms-note   { animation: fadeUp 0.5s ease both; animation-delay: 0.18s; }
        .submit-btn   { animation: fadeUp 0.5s ease both; animation-delay: 0.22s; }
        .divider      { animation: fadeUp 0.5s ease both; animation-delay: 0.27s; }
        .google-btn   { animation: fadeUp 0.5s ease both; animation-delay: 0.32s; }
        .form-footer  { animation: fadeUp 0.5s ease both; animation-delay: 0.36s; }
        .left-top     { animation: fadeIn 0.8s ease both; animation-delay: 0.1s; }
        .left-center  { animation: fadeUp 0.8s ease both; animation-delay: 0.2s; }
        .left-perks   { animation: fadeUp 0.8s ease both; animation-delay: 0.35s; }
      `}</style>

      <div className="reg-page">
        {/* ── LEFT ── */}
        <div className="reg-left">
          <div className="left-noise" />
          <div className="left-grid" />
          <div className="left-glow-top" />
          <div className="left-glow-bottom" />

          <div className="left-top">
            <div className="brand-mark">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="brand-name">CollabX</span>
            </div>
          </div>

          <div className="left-center">
            <h2 className="left-tagline">
              Start building<br />
              with your<br />
              <em>team today.</em>
            </h2>
            <p className="left-sub">
              Join thousands of teams who collaborate smarter and ship faster with CollabX.
            </p>
          </div>

          <div className="left-perks">
            <div className="perk-item">
              <div className="perk-dot">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="perk-text">
                <strong>Free forever on Starter</strong>
                <span>No credit card required to get started.</span>
              </div>
            </div>
            <div className="perk-item">
              <div className="perk-dot">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="perk-text">
                <strong>Real-time collaboration</strong>
                <span>Work together live with your entire team.</span>
              </div>
            </div>
            <div className="perk-item">
              <div className="perk-dot">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div className="perk-text">
                <strong>Enterprise-grade security</strong>
                <span>Your data is encrypted end-to-end.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="reg-right">
          <div className="right-glow" />

          <div className="form-container">
            <div className="form-header">
              <div className="form-eyebrow">Get started</div>
              <h1 className="form-title">
                Create your<br /><span>account.</span>
              </h1>
            </div>

            {error && (
              <div className="error-box">
                <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <div className={`field-wrap${focused === 'name' ? ' focused' : ''}`}>
                  <label className="field-label" htmlFor="name">Full name</label>
                  <div className="field-input-wrap">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="name"
                      className="field-input"
                      type="text"
                      name="name"
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused('')}
                      required
                      autoComplete="name"
                    />
                    <div className="field-bottom-line" />
                  </div>
                </div>

                <div className={`field-wrap${focused === 'email' ? ' focused' : ''}`}>
                  <label className="field-label" htmlFor="email">Email address</label>
                  <div className="field-input-wrap">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="email"
                      className="field-input"
                      type="email"
                      name="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      required
                      autoComplete="email"
                    />
                    <div className="field-bottom-line" />
                  </div>
                </div>

                <div className={`field-wrap${focused === 'password' ? ' focused' : ''}`}>
                  <label className="field-label" htmlFor="password">Password</label>
                  <div className="field-input-wrap">
                    <svg className="field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="password"
                      className="field-input"
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      onFocus={() => setFocused('password')}
                      onBlur={() => setFocused('')}
                      required
                      autoComplete="new-password"
                    />
                    <div className="field-bottom-line" />
                  </div>
                  <p className="pw-hint">Minimum 6 characters</p>
                </div>
              </div>

              <p className="terms-note">
                By creating an account you agree to our{' '}
                <a href="/terms">Terms of Service</a> and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </p>

              <button className="submit-btn" type="submit" disabled={loading}>
                <span className="btn-inner">
                  {loading && <span className="btn-spinner" />}
                  {loading ? 'Creating account…' : 'Create account'}
                </span>
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <a
              className="google-btn"
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </a>

            <p className="form-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
