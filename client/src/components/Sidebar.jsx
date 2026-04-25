import { getInitials } from '../utils/helpers';

const PALETTE = [
  '#ffffff','#e8e8f0','#94a3b8',
  '#ff6584','#f97316','#fbbf24',
  '#43e97b','#06b6d4','#6c63ff',
  '#8b5cf6','#ec4899','#ef4444',
  '#000000','#1e293b','#334155',
  '#84cc16','#14b8a6','#3b82f6',
  '#a16207','#be185d','#7c3aed',
];

export default function Sidebar({
  stroke, setStroke,
  strokeWidth, setStrokeWidth,
  opacity, setOpacity,
  fill, setFill,
  users, myId,
  onClear, onUndo, onExport,
  roomId,
}) {
  return (
    <div className="sidebar">
      {/* ── Color ─────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Stroke Color</div>
        <div className="color-grid">
          {PALETTE.map((c) => (
            <div
              key={c}
              className={`color-swatch${stroke === c ? ' active' : ''}`}
              style={{ background: c }}
              onClick={() => setStroke(c)}
              title={c}
            />
          ))}
        </div>
        <div className="custom-color-row">
          <input
            type="color"
            className="custom-color-input"
            value={stroke}
            onChange={(e) => setStroke(e.target.value)}
            title="Custom color"
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Custom</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{stroke}</span>
        </div>
      </div>

      {/* ── Fill ─────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Fill Color</div>
        <div className="custom-color-row">
          <input
            type="color"
            className="custom-color-input"
            value={fill === 'transparent' ? '#000000' : fill}
            onChange={(e) => setFill(e.target.value)}
          />
          <button
            className="btn btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px' }}
            onClick={() => setFill('transparent')}
          >
            No Fill
          </button>
        </div>
      </div>

      {/* ── Stroke Width ──────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Stroke Width — {strokeWidth}px</div>
        <input
          type="range"
          className="stroke-slider"
          min={1} max={40}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          id="stroke-width-slider"
        />
      </div>

      {/* ── Opacity ───────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Opacity — {Math.round(opacity * 100)}%</div>
        <input
          type="range"
          className="stroke-slider"
          min={0.05} max={1} step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          id="opacity-slider"
        />
      </div>

      {/* ── Actions ───────────────────────────── */}
      <div className="sidebar-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="sidebar-title">Actions</div>
        <button className="btn btn-secondary" onClick={onUndo} id="btn-undo">
          ↩ Undo
        </button>
        <button className="btn btn-danger" onClick={onClear} id="btn-clear">
          🗑 Clear Board
        </button>
        <button className="btn btn-secondary export-btn" onClick={onExport} id="btn-export">
          ↓ Export PNG
        </button>
      </div>

      {/* ── Online Users ──────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">
          Online ({users.length})
        </div>
        <div className="users-list">
          {users.map((u) => (
            <div key={u.id} className="user-item">
              <div
                className="user-dot"
                style={{ background: u.color, color: '#fff' }}
              >
                {getInitials(u.name)}
              </div>
              <div>
                <div className="user-name">{u.name}</div>
                {u.id === myId && <div className="user-you">You</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Room ──────────────────────────────── */}
      <div className="sidebar-section">
        <div className="sidebar-title">Room ID</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em' }}>
          {roomId}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Share this code to invite collaborators
        </div>
      </div>
    </div>
  );
}
