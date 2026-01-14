// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const offersRoutes = require('./routes/offers');
const applicationsRoutes = require('./routes/applications');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS — FIXED (ALLOW VITE FRONTEND)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/applications', applicationsRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Christ Recruiter Portal API is running 🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
