const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const offersRoutes = require("./routes/offers");
const approvalsRoutes = require("./routes/approvals");
const auditLogsRoutes = require("./routes/auditLogs");
const chatbotRoutes = require("./routes/chatbot");

const app = express();

// --- 1. Prisma Global Instance (CRITICAL for Serverless) ---
// Prevents Vercel from opening too many database connections during hot reloads
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// --- 2. Dynamic CORS Configuration ---
const allowedOrigins = [
  "http://localhost:5173",
  "https://internship-portal-eta.vercel.app",
  "https://internship-portal-wsav.vercel.app" // Add your latest frontend domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// --- 3. Health Check & Routes ---
app.get("/", (req, res) => res.json({ message: "API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/approvals", approvalsRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/chat", chatbotRoutes);


// --- 4. Conditional Listen (Vercel handles the port) ---
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// --- 5. Export for Vercel ---
module.exports = app;