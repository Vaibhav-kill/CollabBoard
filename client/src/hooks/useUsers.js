import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Track all users currently in the room, including their cursor positions.
 */
export function useUsers(roomId, myId) {
  const [users, setUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const { on } = useSocket();

  useEffect(() => {
    if (!roomId) return;

    const unsubs = [
      on('users-update', ({ users: u }) => setUsers(u)),

      on('cursor-update', ({ userId, name, color, x, y }) => {
        setCursors((prev) => ({ ...prev, [userId]: { userId, name, color, x, y } }));
      }),

      on('cursor-remove', ({ userId }) => {
        setCursors((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }),

      on('user-left', ({ userId }) => {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setCursors((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }),
    ];

    return () => unsubs.forEach((u) => u && u());
  }, [roomId, on]);

  return { users, cursors };
}
