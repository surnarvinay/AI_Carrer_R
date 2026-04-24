const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// 1️⃣ Load env FIRST
dotenv.config();

// 2️⃣ Connect DB
connectDB();

const app = express();

// 3️⃣ Middleware
app.use(cors()); // optional now (safe to keep)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Import Routes
const authRoutes = require('./routes/auth');
const recommendRoutes = require('./routes/recommend');
const skillsRoutes = require('./routes/skills');
const simulateRoutes = require('./routes/simulate');
const historyRoutes = require('./routes/history');

// 5️⃣ Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/simulate', simulateRoutes);

// ===============================
// 🔥 SERVE FRONTEND (VITE DIST)
// ===============================

const frontendPath = path.join(__dirname, '../client/dist');

app.use(express.static(frontendPath));

// React / SPA routing fix
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ===============================

// 6️⃣ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 INTERNAL SERVER ERROR');
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong on the server'
  });
});

// 7️⃣ Start Server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});