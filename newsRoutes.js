const express = require("express");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/news?search=...&category=...
// Public route: anyone can read news.
router.get("/", (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const category = String(req.query.category || "").trim().toLowerCase();

  let news = req.app.locals.news;
  if (category) news = news.filter(item => item.category.toLowerCase() === category);
  if (search) {
    news = news.filter(item =>
      item.title.toLowerCase().includes(search) ||
      item.summary.toLowerCase().includes(search) ||
      item.content.toLowerCase().includes(search)
    );
  }

  news = [...news].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ count: news.length, news });
});

// POST /api/news
// Protected route: only authenticated admins can publish news.
router.post("/", authenticateToken, requireAdmin, (req, res) => {
  const { title, category, summary, content, image = "" } = req.body;
  if (!title || !category || !summary || !content) {
    return res.status(400).json({ message: "Title, category, summary and content are required." });
  }

  const allowedCategories = ["Technology", "Sports", "Education", "Business", "Entertainment", "World"];
  if (!allowedCategories.includes(category)) {
    return res.status(400).json({ message: "Please select a valid news category." });
  }

  const article = {
    _id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: String(title).trim(),
    category,
    summary: String(summary).trim(),
    content: String(content).trim(),
    image: String(image).trim(),
    createdAt: new Date().toISOString(),
    authorId: req.user.id
  };

  req.app.locals.news.push(article);
  res.status(201).json({ message: "News article published.", news: article });
});

// DELETE /api/news/:id
// Protected route: only authenticated admins can delete news.
router.delete("/:id", authenticateToken, requireAdmin, (req, res) => {
  const index = req.app.locals.news.findIndex(item => item._id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "News article not found." });

  const [deletedArticle] = req.app.locals.news.splice(index, 1);
  res.json({ message: "News article deleted.", news: deletedArticle });
});

module.exports = router;