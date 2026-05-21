export default function OutputPanel({ result, loading }) {

  if (loading) {
    return (
      <div style={s.panel}>
        <div style={s.header}>
          <span style={s.title}>Output</span>
          <span style={s.running}>Running...</span>
        </div>
        <div style={s.body}>
          <span style={s.placeholder}>Executing your code...</span>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={s.panel}>
        <div style={s.header}>
          <span style={s.title}>Output</span>
        </div>
        <div style={s.body}>
          <span style={s.placeholder}>Run your code to see output here.</span>
        </div>
      </div>
    );
  }

  const statusColor = result.isError ? '#f87171' : '#4ade80';

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <span style={s.title}>Output</span>
        <div style={s.meta}>
          {result.status && (
            <span style={{ ...s.statusBadge, color: statusColor, borderColor: statusColor }}>
              {result.status}
            </span>
          )}
          {result.time   && <span style={s.metaItem}>{result.time}s</span>}
          {result.memory && <span style={s.metaItem}>{result.memory} KB</span>}
          {result.executedBy && <span style={s.metaItem}>by {result.executedBy}</span>}
        </div>
      </div>

      <div style={s.body}>
        {result.compile_output && (
          <div style={s.errorSection}>
            <p style={s.errorLabel}>Compilation Error</p>
            <pre style={s.pre}>{result.compile_output}</pre>
          </div>
        )}

        {result.stderr && !result.compile_output && (
          <div style={s.errorSection}>
            <p style={s.errorLabel}>Runtime Error</p>
            <pre style={s.pre}>{result.stderr}</pre>
          </div>
        )}

        {result.stdout && (
          <pre style={s.pre}>{result.stdout}</pre>
        )}

        {!result.compile_output && !result.stderr && !result.stdout && (
          <span style={s.placeholder}>(no output)</span>
        )}
      </div>
    </div>
  );
}

const s = {
  panel:       { display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a1a', borderTop: '1px solid #333', fontFamily: "'Fira Code', 'Consolas', monospace" },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 1rem', background: '#252526', borderBottom: '1px solid #333', flexShrink: 0 },
  title:       { color: '#ccc', fontSize: '0.82rem', fontWeight: '600', letterSpacing: '0.5px' },
  running:     { color: '#facc15', fontSize: '0.78rem' },
  meta:        { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  statusBadge: { fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid', fontFamily: 'sans-serif', fontWeight: '600' },
  metaItem:    { color: '#6b7280', fontSize: '0.75rem', fontFamily: 'sans-serif' },
  body:        { flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' },
  pre:         { margin: 0, fontSize: '0.85rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 },
  placeholder: { color: '#4b5563', fontSize: '0.85rem' },
  errorSection:{ marginBottom: '0.5rem' },
  errorLabel:  { color: '#f87171', fontSize: '0.75rem', fontFamily: 'sans-serif', fontWeight: '600', margin: '0 0 0.35rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
};