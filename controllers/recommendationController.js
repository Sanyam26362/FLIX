const Recommendation = require("../models/Recommendation");
const Movie = require("../models/Movie"); 

// Helper to map Yashasvi's external IDs back to Mongo _id
const mapExternalIdsToMongoIds = async (externalRecs) => {
    if (!externalRecs || externalRecs.length === 0) return [];

    // Extract all of Yashasvi's movie 'id's
    const yashasviIds = externalRecs.map(rec => rec.id).filter(id => id != null); 
    
    // Find all matching movies in MongoDB by the 'id' field
    const movies = await Movie.find({ id: { $in: yashasviIds } }).select('_id id'); 

    // Use a Map for quick lookup: {Yashasvi_ID: Mongo_ID}
    const mongoIdMap = new Map(movies.map(m => [m.id, m._id]));

    // Return only the MongoDB IDs that were successfully matched
    return yashasviIds.map(mlId => mongoIdMap.get(mlId)).filter(id => id != null);
};


exports.getRecommendations = async (req, res) => {
// ... (rest of getRecommendations remains the same)
};

exports.addRecommendations = async (req, res) => {
  try {
    const { userId, recommendedMovies } = req.body; 
    
    if (!userId || !recommendedMovies || !Array.isArray(recommendedMovies)) {
        return res.status(400).json({ msg: "Invalid data format. Requires userId and recommendedMovies array of objects." });
    }

    // recommendedMovies is expected to be an array of objects: [{ id: 123, imdb_id: "tt0123" }, ...]
    const mongoMovieIds = await mapExternalIdsToMongoIds(recommendedMovies);
    
    if (mongoMovieIds.length === 0) {
        console.warn(`[ML Push] No matching Mongo IDs found for user ${userId}. Skipping update.`);
    }

    const recommendation = await Recommendation.findOneAndUpdate(
      { user: userId },
      { recommendedMovies: mongoMovieIds },
      { upsert: true, new: true }
    );
    res.status(200).json(recommendation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};