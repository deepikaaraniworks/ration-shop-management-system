require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ── Middleware ─────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many requests, please try again later' }
});

// Inject Socket.io into req
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/stock', require('./routes/stock'));
app.use('/api', require('./routes/api'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Ration System API is running', timestamp: new Date() });
});

// Serve frontend pages
app.get('/beneficiary*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/beneficiary/index.html'));
});
app.get('/staff*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/staff/index.html'));
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Socket.io ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_shop', (shop_id) => {
    socket.join(`shop_${shop_id}`);
    console.log(`📦 Socket ${socket.id} joined shop_${shop_id}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Ration System Server running on http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`👤 Beneficiary: http://localhost:${PORT}/beneficiary`);
  console.log(`🏪 Staff Panel: http://localhost:${PORT}/staff\n`);
});
