const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const offersRoutes = require("./routes/offers");
const applicationsRoutes = require("./routes/applications");

const app = express();

const prisma = new PrismaClient();

const allowedOrigins = [
  "http://localhost:5173",
  "https://internship-portal-eta.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
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

app.get("/", (req, res) => res.json({ message: "API is running" }));

app.use("/api/auth", authRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/applications", applicationsRoutes);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
