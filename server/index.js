const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// 1️⃣ Load env FIRST
dotenv.config();

// 2️⃣ Connect DB
connectDB();

const app = express();

// 3️⃣ Middleware
app.use(cors({
  origin: '*', // change to your frontend URL later
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4️⃣ Import Routes
const authRoutes = require('./routes/auth');
const recommendRoutes = require('./routes/recommend');
const skillsRoutes = require('./routes/skills');
const simulateRoutes = require('./routes/simulate');
const historyRoutes = require('./routes/history');

// 5️⃣ Mount Routes
if (authRoutes) app.use('/api/auth', authRoutes);
else console.error('❌ authRoutes is not valid');

if (recommendRoutes) app.use('/api/recommend', recommendRoutes);
else console.error('❌ recommendRoutes is not valid');

if (historyRoutes) app.use('/api/history', historyRoutes);
else console.error('❌ historyRoutes is not valid');

if (skillsRoutes) app.use('/api/skills', skillsRoutes);
else console.error('❌ skillsRoutes is not valid');

if (simulateRoutes) app.use('/api/simulate', simulateRoutes);
else console.error('❌ simulateRoutes is not valid');

// 6️⃣ Health Check Route (IMPORTANT for deployment)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Career Recommender API is live 🚀'
  });
});

// 7️⃣ 404 Handler
app.use((req, res) => {
  console.log(`❌ Route Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// 8️⃣ Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 INTERNAL SERVER ERROR');
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong on the server'
  });
});

// 9️⃣ Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});