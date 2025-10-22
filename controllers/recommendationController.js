const Recommendation = require("../models/Recommendation");
const Movie = require("../models/Movie"); 

const mapExternalIdsToMongoIds = async (externalRecs) => {
    if (!externalRecs || externalRecs.length === 0) return [];

    const yashasviIds = externalRecs.map(rec => rec.id).filter(id => id != null); 
    
    const movies = await Movie.find({ id: { $in: yashasviIds } }).select('_id id'); 

    const mongoIdMap = new Map(movies.map(m => [m.id, m._id]));

    return yashasviIds.map(mlId => mongoIdMap.get(mlId)).filter(id => id != null);
};


exports.getRecommendations = async (req, res) => {
};

exports.addRecommendations = async (req, res) => {
  try {
    const { userId, recommendedMovies } = req.body; 
    
    if (!userId || !recommendedMovies || !Array.isArray(recommendedMovies)) {
        return res.status(400).json({ msg: "Invalid data format. Requires userId and recommendedMovies array of objects." });
    }

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