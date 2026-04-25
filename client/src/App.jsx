import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './context/SocketContext';
import { getUserColor } from './utils/helpers';
import { useUsers } from './hooks/useUsers';

import Landing from './components/Landing';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import Whiteboard from './components/Whiteboard';
import RemoteCursors from './components/RemoteCursors';
import ToastContainer, { useToasts } from './components/Toast';

export default function App() {
  // ── Session ───────────────────────────────────────
  const [session, setSession] = useState(null); // { roomId, userName, userColor, userId }
  const [tool, setTool] = useState('pen');

  // ── Drawing config ────────────────────────────────
  const [stroke, setStroke] = useState('#ffffff');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [fill, setFill] = useState('transparent');

  // ── Undo stack (local element ids) ───────────────
  const undoStack = useRef([]); // array of element ids drawn by this user

  const { emit, on, connected, status } = useSocket();
  const { toasts, addToast } = useToasts();

  // ── Users ─────────────────────────────────────────
  const { users, cursors } = useUsers(session?.roomId, session?.userId);

  // ── Join room ─────────────────────────────────────
  const handleJoin = useCallback(({ roomId, userName, userColor }) => {
    const userId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setSession({ roomId, userName, userColor, userId });

    emit('join-room', { roomId, userName, userColor });
    addToast(`✅ Joined room ${roomId}`);
  }, [emit, addToast]);

  // Re-join if socket reconnects
  useEffect(() => {
    if (!session) return;
    const unsub = on('connect', () => {
      emit('join-room', {
        roomId: session.roomId,
        userName: session.userName,
        userColor: session.userColor,
      });
    });
    return unsub;
  }, [session, emit, on]);

  // ── Keyboard shortcuts ────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { handleUndo(); return; }
      const keyMap = {
        'v': 'select', 'p': 'pen', 'e': 'eraser',
        'l': 'line', 'a': 'arrow', 'r': 'rect',
        'c': 'circle', 't': 'text', 'h': 'hand',
      };
      if (keyMap[e.key]) setTool(keyMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Actions ───────────────────────────────────────
  const handleUndo = () => {
    if (!session) return;
    emit('undo', { userId: session.userId });
    addToast('↩ Undo');
  };

  const handleClear = () => {
    if (!session) return;
    if (!window.confirm('Clear the entire board? This affects all users.')) return;
    emit('clear-board');
    addToast('🗑 Board cleared');
  };

  const handleExport = () => {
    if (window.__exportCanvas) {
      window.__exportCanvas();
      addToast('↓ Exporting PNG…');
    }
  };

  const handleCopyRoom = () => {
    if (!session) return;
    navigator.clipboard.writeText(session.roomId)
      .then(() => addToast('📋 Room ID copied!'))
      .catch(() => addToast('Room ID: ' + session.roomId));
  };

  // ── Render ────────────────────────────────────────
  if (!session) {
    return (
      <>
        <Landing onJoin={handleJoin} />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <div className="app">
        <Header
          roomId={session.roomId}
          users={users}
          myId={session.userId}
          connected={connected}
          status={status}
          onCopyRoom={handleCopyRoom}
        />

        <Toolbar tool={tool} setTool={setTool} />

        {/* Canvas wrapper: relative for remote cursors overlay */}
        <div style={{ gridArea: 'canvas', position: 'relative', overflow: 'hidden' }}>
          <Whiteboard
            tool={tool}
            stroke={stroke}
            strokeWidth={strokeWidth}
            opacity={opacity}
            fill={fill}
            userId={session.userId}
            onUndo={handleUndo}
          />
          <RemoteCursors cursors={cursors} myId={session.userId} />
        </div>

        <Sidebar
          stroke={stroke} setStroke={setStroke}
          strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          opacity={opacity} setOpacity={setOpacity}
          fill={fill} setFill={setFill}
          users={users}
          myId={session.userId}
          onClear={handleClear}
          onUndo={handleUndo}
          onExport={handleExport}
          roomId={session.roomId}
        />
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}
