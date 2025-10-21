const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: [String],
  description: String,
  
  
  trailer_link: String, 
  poster_path: String,  
  
  rating: Number,
  
  id: { type: Number, unique: true, required: true }, 
  imdb_id: { type: String, unique: true } 
});

module.exports = mongoose.model("Movie", movieSchema);