const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    recommendedMoviesData: { 
        type: [mongoose.Schema.Types.Mixed], 
        default: [] 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Recommendation", recommendationSchema);