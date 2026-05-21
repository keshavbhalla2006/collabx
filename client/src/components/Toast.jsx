import { useEffect, useState } from 'react';
import { FiVideo, FiX } from 'react-icons/fi';

export default function Toast({ message, onClose, onAction, actionLabel, duration = 8000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div style={s.wrapper}>
      <div style={s.icon}><FiVideo size={18} color="#a78bfa" /></div>
      <div style={s.content}>
        <p style={s.message}>{message}</p>
        {onAction && (
          <button style={s.actionBtn} onClick={() => { onAction(); setVisible(false); }}>
            {actionLabel}
          </button>
        )}
      </div>
      <button style={s.closeBtn} onClick={() => { setVisible(false); onClose?.(); }}>
        <FiX size={14} />
      </button>
    </div>
  );
}

const s = {
  wrapper: {
    position: 'fixed',
    bottom: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#1f1f35',
    border: '1px solid #a78bfa',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    zIndex: 9999,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    minWidth: '320px',
    maxWidth: '480px',
  },
  icon: { flexShrink: 0 },
  content: { flex: 1 },
  message: {
    color: '#e2e8f0',
    fontSize: '0.85rem',
    fontFamily: 'sans-serif',
    margin: '0 0 0.4rem',
    lineHeight: 1.4,
  },
  actionBtn: {
    background: '#6c63ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '0.3rem 0.8rem',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontWeight: '600',
    fontFamily: 'sans-serif',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },
};