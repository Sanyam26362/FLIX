// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const passport = require("passport"); // ADDED
require("./config/passport"); // ADDED: Load passport config

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const movieRoutes = require("./routes/movieRoutes");
const bookmarkRoutes = require("./routes/bookmarkRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use(passport.initialize()); // ADDED: Initialize Passport

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/recommendations", recommendationRoutes);

// Hardcode PORT to 5000 as requested
const PORT = 5000;

app.listen(PORT , () =>
  console.log(`🎬 Server running on port ${PORT}`) 
);