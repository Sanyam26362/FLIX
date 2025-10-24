const Recommendation = require('../models/Recommendation');
const User = require('../models/User');
const axios = require('axios');
const mongoose = require('mongoose'); 

exports.sendUserPreferencesToML = async (req, res) => {
};


exports.receiveRecommendationsFromML = async (req, res) => {
    try {
        const { userId, recommendations, bookmarked_movies } = req.body;

        if (!userId || !Array.isArray(recommendations)) {
            return res.status(400).json({
                msg: "Invalid data format. Requires userId and a 'recommendations' array."
            });
        }

        const cleanUserId = userId.trim();

        const user = await User.findById(cleanUserId);
        if (!user) return res.status(404).json({ msg: "User not found" });

        if (recommendations.length > 0) {
            console.log(`[ML Trigger] Received ${recommendations.length} recs from ML. First movie ID: ${recommendations[0]?.id}, Title: ${recommendations[0]?.title}`);
        } else {
            console.log(`[ML Trigger] Received empty recommendations array from ML.`);
        }

        const updatedRecommendation = await Recommendation.findOneAndUpdate(
            { user: cleanUserId }, 
            {
                user: cleanUserId,
                recommendedMoviesData: recommendations,
                bookmarked_movies: bookmarked_movies,
            },
            {
                new: true,    
                upsert: true, 
                runValidators: true, 
                setDefaultsOnInsert: true 
            }
        );

        console.log(`[ML Trigger] Recommendations saved/updated for user: ${cleanUserId}. Doc ID: ${updatedRecommendation._id}, UpdatedAt: ${updatedRecommendation.updatedAt}`); // Log Update Time
        res.status(200).json(updatedRecommendation); 

    } catch (err) {
        console.error(" Error saving/updating recommendations:", err.message);
        if (err.code === 11000) {
             console.error("Attempted duplicate recommendation entry despite upsert:", err);
        }
        res.status(500).json({ msg: "Server Error during recommendation save/update", error: err.message });
    }
};


exports.getRecommendationsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`[GET Recs] Attempting to fetch recommendations for user ID: ${userId}`);

        if (!mongoose.Types.ObjectId.isValid(userId.trim())) {
             console.log(`[GET Recs] Invalid User ID format: ${userId}`); 
             return res.status(400).json({ message: "Invalid User ID format" });
        }
        const cleanUserId = userId.trim();
        console.log(`[GET Recs] Cleaned User ID: ${cleanUserId}`); 

      
        console.log(`[GET Recs] Querying DB: Recommendation.findOne({ user: ${cleanUserId} })`);
        const recommendations = await Recommendation.findOne({ user: cleanUserId });

        if (!recommendations) {
            console.log(`[GET Recs] No recommendations found in DB for user: ${cleanUserId}`); 
            return res.status(404).json({ message: "No recommendations found for this user yet" });
        }

        console.log(`[GET Recs] Found recommendation document! ID: ${recommendations._id}, UpdatedAt: ${recommendations.updatedAt}`);
        if (recommendations.recommendedMoviesData && recommendations.recommendedMoviesData.length > 0) {
            console.log(`[GET Recs] First recommended movie title being sent: ${recommendations.recommendedMoviesData[0].title}`);
        } else {
             console.log(`[GET Recs] Recommendation document found, but recommendedMoviesData is empty.`);
        }

        res.status(200).json(recommendations);

    } catch (error) {
        console.error("[GET Recs] Error fetching user recommendations:", error); 
        res.status(500).json({ message: "Server error fetching recommendations" });
    }
};

