const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const offersRoutes = require('./routes/offers');
const applicationsRoutes = require('./routes/applications');

const app = express();

/* ================= PRISMA ================= */
let prisma;
if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

/* ================= CORS ================= */
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

/* ================= MIDDLEWARE ================= */
app.use(express.json());

/* ================= ROUTES ================= */
app.use('/api/auth', authRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/applications', applicationsRoutes);

/* ================= HEALTH CHECK ================= */
app.get('/', (req, res) => {
  res.status(200).send('Backend running 🚀');
});

/* ================= EXPORT FOR VERCEL ================= */
module.exports = app;

/* ================= LOCAL DEV ONLY ================= */
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
