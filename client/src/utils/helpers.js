import { useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * Throttle helper – returns a function that fires at most once per `ms`.
 */
export function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) { last = now; fn(...args); }
  };
}

/**
 * Generate a visually distinct user color from a set of pleasant swatches.
 */
const USER_COLORS = [
  '#6c63ff','#ff6584','#43e97b','#f7971e','#12c2e9',
  '#f64f59','#43caa8','#fa709a','#fee140','#a18cd1',
];
export function getUserColor(index) {
  return USER_COLORS[index % USER_COLORS.length];
}

/**
 * Derive initials from a name string.
 */
export function getInitials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Hook: cursor broadcasting with throttle.
 */
export function useCursorBroadcast(throttleMs = 30) {
  const { emit } = useSocket();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const broadcast = useCallback(
    throttle(({ x, y }) => emit('cursor-move', { x, y }), throttleMs),
    [emit, throttleMs]
  );
  return broadcast;
}
