const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const offersRoutes = require("./routes/offers");
const applicationsRoutes = require("./routes/applications");

const app = express();

/* =========================
   ✅ PRISMA (SERVERLESS SAFE)
========================= */
const { PrismaClient } = require("@prisma/client");

let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Make prisma available in routes if needed
app.set("prisma", prisma);

/* =========================
   ✅ CORS CONFIG
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://internship-portal.vercel.app" // ✅ replace if frontend URL changes
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/* =========================
   MIDDLEWARE
========================= */
app.use(express.json());

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/applications", applicationsRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Christ Recruiter Portal API is running 🚀");
});

/* =========================
   ✅ EXPORT FOR VERCEL
========================= */
module.exports = app;

/* =========================
   ✅ LOCAL SERVER ONLY
========================= */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
