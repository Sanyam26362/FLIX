const mongoose = require("mongoose");

const interactionSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Movie", 
        default: null 
    },
    type: { 
        type: String, 
        required: true, 
        enum: ['VIEW', 'SEARCH', 'TRAILER_WATCH'] 
    },
    query: {
        type: String,
        default: null
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

interactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Interaction", interactionSchema);