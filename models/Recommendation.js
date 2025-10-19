const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recommendedMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Recommendation", recommendationSchema);
