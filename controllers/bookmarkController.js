
const Bookmark = require("../models/Bookmark");
const Movie = require("../models/Movie"); // ⬅️ NEW: Required for ID lookup

exports.addBookmark = async (req, res) => {
    try {
        const externalId = req.body.movieId; 

        if (!externalId) {
            return res.status(400).json({ msg: "Please provide a movie ID." });
        }
        
        const movieDoc = await Movie.findOne({ id: externalId }).select('_id');

        if (!movieDoc) {
            return res.status(404).json({ msg: "Movie not found in database. Cannot bookmark." });
        }
        
        const mongoMovieId = movieDoc._id; 

        const existingBookmark = await Bookmark.findOne({ user: req.user, movie: mongoMovieId });
        if (existingBookmark) {
            return res.status(200).json({ msg: "Movie already bookmarked", bookmark: existingBookmark });
        }

        const bookmark = await Bookmark.create({ user: req.user, movie: mongoMovieId });
        res.status(201).json(bookmark); 

    } catch (err) {
        res.status(500).json({ error: "Server Error during bookmarking: " + err.message });
    }
};

exports.getBookmarks = async (req, res) => {
    try {
        const bookmarks = await Bookmark.find({ user: req.user }).populate("movie");
        res.status(200).json(bookmarks);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};

exports.removeBookmark = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Bookmark.findOneAndDelete({ _id: id, user: req.user });

        if (!result) {
            return res.status(404).json({ msg: "Bookmark not found or unauthorized to delete" });
        }

        res.status(200).json({ msg: "Bookmark removed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};