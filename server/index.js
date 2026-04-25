const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// In-memory state: rooms → { elements[], users{} }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { elements: [], users: new Map() });
  }
  return rooms.get(roomId);
}

// REST: create a new room
app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  getRoom(roomId);
  res.json({ roomId });
});

// REST: get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  if (!rooms.has(roomId)) return res.status(404).json({ error: 'Room not found' });
  const room = rooms.get(roomId);
  res.json({ roomId, elementCount: room.elements.length, userCount: room.users.size });
});

io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  // ── JOIN ROOM ──────────────────────────────────────────────
  socket.on('join-room', ({ roomId, userName, userColor }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = roomId;
    currentUser = { id: socket.id, name: userName, color: userColor, cursor: null };

    socket.join(roomId);
    const room = getRoom(roomId);
    room.users.set(socket.id, currentUser);

    // Send existing canvas state
    socket.emit('init-state', { elements: room.elements });

    // Broadcast users list
    const users = Array.from(room.users.values());
    io.to(roomId).emit('users-update', { users });

    socket.to(roomId).emit('user-joined', { user: currentUser });
  });

  // ── DRAWING EVENTS ─────────────────────────────────────────
  socket.on('draw-start', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('draw-start', data);
  });

  socket.on('draw-step', (data) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('draw-step', data);
  });

  socket.on('draw-end', (data) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    room.elements.push(data.element);
    // Trim history to last 2000 elements to avoid memory blow-up
    if (room.elements.length > 2000) room.elements.shift();
    socket.to(currentRoom).emit('draw-end', data);
  });

  // ── ELEMENT UPDATES (move, resize, delete) ─────────────────
  socket.on('element-update', (data) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    const idx = room.elements.findIndex((el) => el.id === data.element.id);
    if (idx !== -1) room.elements[idx] = data.element;
    socket.to(currentRoom).emit('element-update', data);
  });

  socket.on('element-delete', (data) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    room.elements = room.elements.filter((el) => el.id !== data.elementId);
    socket.to(currentRoom).emit('element-delete', data);
  });

  // ── CLEAR BOARD ────────────────────────────────────────────
  socket.on('clear-board', () => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    room.elements = [];
    io.to(currentRoom).emit('clear-board');
  });

  // ── UNDO ───────────────────────────────────────────────────
  socket.on('undo', ({ userId }) => {
    if (!currentRoom) return;
    const room = getRoom(currentRoom);
    // Remove last element drawn by this user
    for (let i = room.elements.length - 1; i >= 0; i--) {
      if (room.elements[i].userId === userId) {
        room.elements.splice(i, 1);
        io.to(currentRoom).emit('init-state', { elements: room.elements });
        break;
      }
    }
  });

  // ── CURSOR PRESENCE ────────────────────────────────────────
  socket.on('cursor-move', ({ x, y }) => {
    if (!currentRoom || !currentUser) return;
    currentUser.cursor = { x, y };
    socket.to(currentRoom).emit('cursor-update', {
      userId: socket.id,
      name: currentUser.name,
      color: currentUser.color,
      x,
      y,
    });
  });

  // ── DISCONNECT ─────────────────────────────────────────────
  socket.on('disconnect', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (!room) return;
    room.users.delete(socket.id);
    const users = Array.from(room.users.values());
    io.to(currentRoom).emit('users-update', { users });
    socket.to(currentRoom).emit('user-left', { userId: socket.id });
    socket.to(currentRoom).emit('cursor-remove', { userId: socket.id });
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Whiteboard server running on http://localhost:${PORT}`);
});
