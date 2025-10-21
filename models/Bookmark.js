const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bookmark", bookmarkSchema);