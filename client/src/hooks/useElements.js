import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Manages the full list of canvas elements and syncs them via Socket.io.
 */
export function useElements(roomId) {
  const [elements, setElements] = useState([]);
  const { on, emit } = useSocket();
  // Track "in-progress" strokes from remote users: socketId → partial element
  const liveRemote = useRef({});

  useEffect(() => {
    if (!roomId) return;

    const unsubs = [
      on('init-state', ({ elements: els }) => {
        setElements(els);
        liveRemote.current = {};
      }),

      on('draw-start', ({ element }) => {
        liveRemote.current[element.userId] = element;
        setElements((prev) => {
          if (prev.find((e) => e.id === element.id)) return prev;
          return [...prev, element];
        });
      }),

      on('draw-step', ({ elementId, userId, points }) => {
        liveRemote.current[userId] = {
          ...(liveRemote.current[userId] || {}),
          id: elementId,
          points,
        };
        setElements((prev) =>
          prev.map((el) =>
            el.id === elementId ? { ...el, points } : el
          )
        );
      }),

      on('draw-end', ({ element }) => {
        delete liveRemote.current[element.userId];
        setElements((prev) => {
          const filtered = prev.filter((el) => el.id !== element.id);
          return [...filtered, element];
        });
      }),

      on('element-update', ({ element }) => {
        setElements((prev) =>
          prev.map((el) => (el.id === element.id ? element : el))
        );
      }),

      on('element-delete', ({ elementId }) => {
        setElements((prev) => prev.filter((el) => el.id !== elementId));
      }),

      on('clear-board', () => {
        setElements([]);
        liveRemote.current = {};
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub && unsub());
  }, [roomId, on]);

  // Local add (optimistic)
  const addElement = (el) => {
    setElements((prev) => [...prev, el]);
  };

  const updateElement = (id, updates) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    emit('element-delete', { elementId: id });
  };

  const clearBoard = () => {
    setElements([]);
    emit('clear-board');
  };

  return {
    elements,
    setElements,
    addElement,
    updateElement,
    deleteElement,
    clearBoard,
  };
}
