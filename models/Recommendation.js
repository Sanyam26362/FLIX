const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
    unique: true,   
    index: true     
  },
  recommendedMoviesData: { type: Array, required: true },
  bookmarked_movies: { type: Array },
 
}, {
  timestamps: true 
});



module.exports = mongoose.model('Recommendation', RecommendationSchema);
