require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const newsRoutes = require("./routes/newsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Temporary in-memory data. It will reset when the server restarts.
app.locals.users = [];
app.locals.news = [
  {
    _id: "news-1",
    title: "Digital learning tools are changing classrooms",
    category: "Education",
    summary: "Schools are exploring digital resources to make learning more interactive and accessible.",
    content: "Digital learning tools can support lessons through videos, online resources and interactive activities. Access to devices, connectivity and guidance remains important.",
    image: "",
    createdAt: new Date().toISOString()
  },
  {
    _id: "news-2",
    title: "New technology trends to watch",
    category: "Technology",
    summary: "Artificial intelligence and cloud services continue to influence modern digital products.",
    content: "Technology continues to evolve across education, healthcare, business and communication. Responsible use, privacy and digital skills are important.",
    image: "",
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    _id: "news-3",
    title: "Local teams prepare for upcoming sports season",
    category: "Sports",
    summary: "Players and coaches are preparing through training sessions and practice matches.",
    content: "Teams are preparing for the upcoming season with fitness sessions, strategy discussions and practice matches.",
    image: "",
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "NewsHub API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/news", newsRoutes);

// Handle unknown API endpoints.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API endpoint not found." });
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.status ? err.message : "Internal server error."
  });
});

app.listen(PORT, () => {
  console.log(`NewsHub backend running at http://localhost:${PORT}`);
});