const Recommendation = require("../models/Recommendation");

exports.getRecommendations = async (req, res) => {
    try {
        const rec = await Recommendation.findOne({ user: req.user }).populate("recommendedMovies");
        
        if (!rec) {
             return res.status(200).json({ message: "No recommendations yet. Please set interests.", recommendedMovies: [] });
        }
        res.status(200).json(rec);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};

exports.addRecommendations = async (req, res) => {
    try {
        const { userId, movieIds } = req.body;
        
        if (!userId || !movieIds || !Array.isArray(movieIds)) {
            return res.status(400).json({ msg: "Invalid data format: requires userId and movieIds array." });
        }
        
        const recommendation = await Recommendation.findOneAndUpdate(
            { user: userId },
            { recommendedMovies: movieIds },
            { upsert: true, new: true }
        );
        
        res.status(200).json({ msg: "Recommendations updated successfully", recommendation });
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};