require("dotenv").config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const connectDB = require("./config/db");
require("./config/passport");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(cors({ 
  origin: FRONTEND_URL,
  credentials: true 
}));
app.use(express.json());
app.use(passport.initialize());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
  res.status(200).send(" API is running successfully!");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Frontend URL allowed: ${FRONTEND_URL}`);
});
