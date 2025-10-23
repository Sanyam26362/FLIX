
const Recommendation = require('../models/Recommendation');
const User = require('../models/User');
const axios = require('axios');


exports.sendUserPreferencesToML = async (req, res) => {
    try {
        const { watched_ids, searched_ids, bookmarked_movies, genres, language } = req.body;

        console.log("[ML Trigger] Sending Payload to ML:", JSON.stringify(req.body));

        const apiKey = process.env.DATA_SERVICE_API_KEY;
        if (!apiKey) return res.status(401).json({ msg: "Access Denied: API Key missing" });

        const mlResponse = await axios.post(
            process.env.YASHASVI_ML_INPUT_ENDPOINT,
            { watched_ids, searched_ids, bookmarked_movies, genres, language },
            { headers: { 'x-api-key': apiKey } }
        );

        const mlData = mlResponse.data;

        if (!mlData.recommendations || !Array.isArray(mlData.recommendations)) {
            console.error("❌ Invalid ML response format. Full response:", mlData);
            return res.status(400).json({ msg: "Invalid ML response format" });
        }

        res.status(200).json({
            msg: "ML Response received successfully",
            data: mlData
        });
    } catch (err) {
        console.error("❌ Error communicating with ML service:", err.message);
        res.status(500).json({ msg: "Error contacting ML service", error: err.message });
    }
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

        const newRecommendation = new Recommendation({
            user: cleanUserId, 
            recommendedMoviesData: recommendations, 
            bookmarked_movies, 
        });

        const saved = await newRecommendation.save();

        res.status(200).json(saved);
    } catch (err) {
        console.error("❌ Error saving recommendations:", err.message);
        res.status(500).json({ msg: "Server Error", error: err.message });
    }
};


exports.getRecommendationsByUser = async (req, res) => {
    try {
        const { userId } = req.params; 
        
        const cleanUserId = userId.trim();

        const recommendations = await Recommendation.findOne({ user: cleanUserId })
            .sort({ createdAt: -1 }); 

        if (!recommendations) {
            return res.status(404).json({ message: "No recommendations found for this user" });
        }

        res.status(200).json(recommendations);
    } catch (error) {
        console.error("Error fetching user recommendations:", error);
        res.status(500).json({ message: "Server error fetching recommendations" });
    }
};