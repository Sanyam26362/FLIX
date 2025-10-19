// models/Movie.js
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: [String],
    description: String,
    trailerUrl: String,
    posterUrl: String,
    rating: Number,
    // NEW: Field to link to Yashasvi's dataset IDs (e.g., IMDB ID)
    externalId: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Movie", movieSchema);