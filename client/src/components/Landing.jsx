import { useState } from 'react';
import { SERVER_URL } from '../context/SocketContext';
import { getUserColor } from '../utils/helpers';

const ADJ = ['Creative','Bold','Swift','Bright','Cosmic','Electric','Vivid'];
const NOUNS = ['Painter','Artist','Sketcher','Dreamer','Builder','Creator','Thinker'];
function randomName() {
  return `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
}

export default function Landing({ onJoin }) {
  const [name, setName] = useState(randomName());
  const [roomInput, setRoomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const color = getUserColor(Math.floor(Math.random() * 10));

  const handleCreate = async () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms`, { method: 'POST' });
      const { roomId } = await res.json();
      onJoin({ roomId, userName: name.trim(), userColor: color });
    } catch {
      setError('Could not reach server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (!name.trim()) { setError('Please enter your name'); return; }
    const id = roomInput.trim().toUpperCase();
    if (!id) { setError('Please enter a Room ID'); return; }
    onJoin({ roomId: id, userName: name.trim(), userColor: color });
  };

  return (
    <div className="landing">
      {/* Logo */}
      <div className="landing-logo">
        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="56" height="56" rx="16" fill="url(#lg)"/>
          <path d="M14 42 L21 22 L28 34 L35 18 L42 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="42" cy="18" r="4" fill="white"/>
          <defs>
            <linearGradient id="lg" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6c63ff"/>
              <stop offset="1" stopColor="#43e97b"/>
            </linearGradient>
          </defs>
        </svg>
        <h1 className="landing-title">CollabBoard</h1>
      </div>

      <p className="landing-subtitle">
        Real-time collaborative whiteboard. Draw together, instantly.
        No account needed — just pick a name and start creating.
      </p>

      <div className="landing-card">
        <h2>Get Started</h2>

        {error && (
          <div style={{
            background: 'rgba(255,101,132,0.1)',
            border: '1px solid rgba(255,101,132,0.3)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: 'var(--accent2)',
          }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label htmlFor="input-name">Your Name</label>
          <input
            id="input-name"
            className="input-field"
            placeholder="e.g. Creative Artist"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <button
          id="btn-create-room"
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? '⏳ Creating…' : '✦ Create New Board'}
        </button>

        <div className="divider">or join existing</div>

        <div className="input-group">
          <label htmlFor="input-room">Room ID</label>
          <input
            id="input-room"
            className="input-field"
            placeholder="e.g. A1B2C3D4"
            value={roomInput}
            onChange={(e) => { setRoomInput(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
          />
        </div>

        <button
          id="btn-join-room"
          className="btn btn-secondary"
          onClick={handleJoin}
        >
          → Join Board
        </button>
      </div>

      {/* Features row */}
      <div style={{ display: 'flex', gap: 24, zIndex: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: '🎨', text: 'Pen, shapes & text' },
          { icon: '⚡', text: 'Real-time sync' },
          { icon: '👥', text: 'Cursor presence' },
          { icon: '🔒', text: 'Private rooms' },
        ].map((f) => (
          <div key={f.text} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 16px',
            fontSize: 13, color: 'var(--text-muted)',
          }}>
            <span>{f.icon}</span> {f.text}
          </div>
        ))}
      </div>
    </div>
  );
}
