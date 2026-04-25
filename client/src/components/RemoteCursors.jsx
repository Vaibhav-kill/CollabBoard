import { useState, useEffect } from 'react';

export default function RemoteCursors({ cursors, myId }) {
  return (
    <>
      {Object.values(cursors).map((c) => {
        if (c.userId === myId) return null;
        return (
          <div
            key={c.userId}
            className="remote-cursor"
            style={{
              left: c.x,
              top: c.y,
              '--cursor-color': c.color,
            }}
          >
            <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
              <path
                d="M0 0 L14 6 L8 8 L6 14 Z"
                fill={c.color}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth="1"
              />
            </svg>
            <div
              className="remote-cursor-label"
              style={{ background: c.color }}
            >
              {c.name}
            </div>
          </div>
        );
      })}
    </>
  );
}
