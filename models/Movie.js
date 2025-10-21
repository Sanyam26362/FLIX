const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: [String],
    description: String,
    trailerUrl: String, 
    posterUrl: String,
    rating: Number
});

module.exports = mongoose.model("Movie", movieSchema);