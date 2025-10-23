const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recommendedMoviesData: { type: Array, required: true },
  bookmarked_movies: { type: Array },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);