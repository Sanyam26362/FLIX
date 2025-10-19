const User = require("../models/User");
const jwt = require("jsonwebtoken");

const triggerInitialRecommendations = async (userId) => {
    console.log(`[ML Trigger] Requesting initial recommendations for user: ${userId}`);
    
};


exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-googleId -createdAt -__v');
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, interests, profilePic } = req.body;
        
        const updatedUser = await User.findByIdAndUpdate(
            req.user,
            { name, interests, profilePic },
            { new: true, runValidators: true } 
        ).select('-password -googleId -createdAt -__v');
        
        if (!updatedUser) return res.status(404).json({ msg: "User not found" });
        
        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};

exports.addInterests = async (req, res) => {
    try {
        const { interests } = req.body;
        
        if (!interests || !Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({ msg: "Please select at least one interest." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user, 
            { interests: interests },
            { new: true, runValidators: true }
        ).select('-password -googleId -createdAt -__v');

        if (!updatedUser) {
            return res.status(404).json({ msg: "User not found." });
        }

        triggerInitialRecommendations(req.user); 

        res.status(200).json({ 
            msg: "Interests saved successfully. Recommendations generating.", 
            user: updatedUser 
        });

    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};
