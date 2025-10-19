const Bookmark = require("../models/Bookmark");

exports.addBookmark = async (req, res) => {
    try {
        const { movieId } = req.body;
        
        const existingBookmark = await Bookmark.findOne({ user: req.user, movie: movieId });
        if (existingBookmark) {
            return res.status(200).json({ msg: "Movie already bookmarked", bookmark: existingBookmark });
        }

        const bookmark = await Bookmark.create({ user: req.user, movie: movieId });
        res.status(201).json(bookmark); 
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
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
