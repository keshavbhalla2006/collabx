import { useState } from 'react';

export default function StdinInput({ value, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={s.wrapper}>
      <button style={s.toggle} onClick={() => setOpen(!open)}>
        stdin {open ? '▲' : '▼'}
      </button>
      {open && (
        <textarea
          style={s.area}
          placeholder="Provide input for your program here (stdin)..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          spellCheck={false}
        />
      )}
    </div>
  );
}

const s = {
  wrapper: { background: '#252526', borderTop: '1px solid #333', flexShrink: 0 },
  toggle:  { background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer', padding: '0.35rem 1rem', fontFamily: 'sans-serif' },
  area:    { display: 'block', width: '100%', background: '#1e1e1e', color: '#e2e8f0', border: 'none', borderTop: '1px solid #333', padding: '0.6rem 1rem', fontSize: '0.85rem', fontFamily: "'Fira Code', 'Consolas', monospace", resize: 'none', outline: 'none', boxSizing: 'border-box' },
};