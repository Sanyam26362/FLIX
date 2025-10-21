// ====================================================================
// --- models/Movie.js (FINALIZED SCHEMA - UPDATED) ---
// ====================================================================
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  // CORE FIELDS
  title: { type: String, required: true },
  description: { type: String, default: "" },
  genre: { type: [String], default: [] },

  // DISPLAY & METADATA FIELDS
  poster_path: { type: String, default: "" },
  trailer_link: { type: String, default: "" },
  vote_average: { type: Number, default: 0 },
  vote_count: { type: Number, default: 0 },
  runtime: { type: Number, default: 0 },
  production_countries: { type: String, default: "" },
  release_date: { type: String, default: "" },
  popularity: { type: Number, default: 0 },  // ← Added this to match CSV data

  // SYNCHRONIZATION IDENTIFIERS
  id: { type: Number, unique: true, required: true },
  imdb_id: { type: String, unique: true, sparse: true },

  // SYSTEM FIELD
  createdAt: { type: Date, default: Date.now }
});

// Optional: To make queries faster on frequently accessed fields
movieSchema.index({ title: 1 });
movieSchema.index({ id: 1 });
movieSchema.index({ imdb_id: 1 });

module.exports = mongoose.model("Movie", movieSchema);
