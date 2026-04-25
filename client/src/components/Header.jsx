import { getInitials } from '../utils/helpers';

export default function Header({ roomId, users, myId, connected, status, onCopyRoom }) {
  const myUser = users.find((u) => u.id === myId);

  const statusLabel = status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting…' : 'Offline';

  return (
    <header className="header">
      {/* Logo */}
      <div className="header-logo">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="12" fill="url(#grad)"/>
          <path d="M12 36 L18 20 L24 30 L30 16 L36 36" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="36" cy="16" r="3" fill="white"/>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6c63ff"/>
              <stop offset="1" stopColor="#43e97b"/>
            </linearGradient>
          </defs>
        </svg>
        CollabBoard
      </div>

      {/* Room ID button */}
      <button
        className="header-room"
        onClick={onCopyRoom}
        title="Click to copy room link"
        id="btn-copy-room"
      >
        <span className="header-room-label">ROOM</span>
        <span className="header-room-id">{roomId}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📋</span>
      </button>

      {/* Connection status */}
      <div className={`conn-badge ${status}`}>
        <span style={{ fontSize: 10 }}>●</span>
        {statusLabel}
      </div>

      <div className="header-spacer" />

      {/* Online count */}
      <div className="online-badge">
        <span className="online-dot" />
        {users.length} online
      </div>

      {/* User avatars (up to 5) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: -4 }}>
        {users.slice(0, 5).map((u) => (
          <div
            key={u.id}
            className="user-dot"
            style={{ background: u.color, color: '#fff', marginLeft: -6, zIndex: 1 }}
            title={u.name}
          >
            {getInitials(u.name)}
          </div>
        ))}
        {users.length > 5 && (
          <div className="user-dot" style={{ background: 'var(--surface2)', marginLeft: -6 }}>
            +{users.length - 5}
          </div>
        )}
      </div>
    </header>
  );
}
