
const Recommendation = require("../models/Recommendation");
const Movie = require("../models/Movie"); 



exports.getRecommendations = async (req, res) => {
    try {
        const recommendation = await Recommendation.findOne({ user: req.user }).select('recommendedMoviesData');

        if (!recommendation || recommendation.recommendedMoviesData.length === 0) {
            return res.status(200).json([]);
        }
        
        res.status(200).json(recommendation.recommendedMoviesData);
    } catch (err) {
        res.status(500).json({ error: "Server Error fetching recommendations: " + err.message });
    }
};



exports.addRecommendations = async (req, res) => {
    try {
        const { userId, recommendations, bookmarked_movies } = req.body; 
        
        if (!userId || !Array.isArray(recommendations)) {
            return res.status(400).json({ msg: "Invalid data format. Requires userId and a 'recommendations' array." });
        }

        const recommendation = await Recommendation.findOneAndUpdate(
            { user: userId },
            { 
                recommendedMoviesData: recommendations, 
                bookmarkedMovieIds: bookmarked_movies 
            },
            { upsert: true, new: true }
        );
        
        res.status(200).json(recommendation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};