
const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  genre: { type: [String], default: [] },

  poster_path: { type: String, default: "" },
  trailer_link: { type: String, default: "" },
  vote_average: { type: Number, default: 0 },
  vote_count: { type: Number, default: 0 },
  runtime: { type: Number, default: 0 },
  production_countries: { type: String, default: "" },
  release_date: { type: String, default: "" },
  popularity: { type: Number, default: 0 },  

  id: { type: Number, unique: true, required: true },
  imdb_id: { type: String, unique: true, sparse: true },

  createdAt: { type: Date, default: Date.now }
});

movieSchema.index({ title: 1 });
movieSchema.index({ id: 1 });
movieSchema.index({ imdb_id: 1 });

module.exports = mongoose.model("Movie", movieSchema);
