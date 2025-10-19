// controllers/recommendationController.js
const Recommendation = require("../models/Recommendation");
const mongoose = require("mongoose"); // ADDED for ID validation

// Existing function is correct
exports.getRecommendations = async (req, res) => {
    try {
        const rec = await Recommendation.findOne({ user: req.user }).populate("recommendedMovies");
        if (!rec) return res.status(200).json({ message: "No recommendations yet", recommendedMovies: [] });
        res.status(200).json(rec);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Called by ML Team - ***SECURITY CHECK MUST BE IN PLACE IN THE ROUTE HANDLER***
exports.addRecommendations = async (req, res) => {
    try {
        // userId should technically be validated here as well
        const { userId, movieIds } = req.body; 
        
        // Basic validation
        if (!userId || !movieIds || !Array.isArray(movieIds)) {
            return res.status(400).json({ msg: "Invalid data format for recommendations" });
        }

        // NEW: Validate that all provided IDs are valid MongoDB ObjectIds
        const invalidIds = movieIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ msg: "One or more provided movie IDs are not valid MongoDB IDs." });
        }
        
        const recommendation = await Recommendation.findOneAndUpdate(
            { user: userId },
            { recommendedMovies: movieIds },
            { upsert: true, new: true }
        );
        res.status(200).json(recommendation);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};