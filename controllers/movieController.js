const Movie = require("../models/Movie");
const Interaction = require("../models/Interaction"); 

const logInteraction = async (userId, type, movieId = null, query = null) => {
    try {
        if (!userId) return; 
        await Interaction.create({
            user: userId,
            type: type,
            movie: movieId,
            query: query
        });
    } catch (error) {
        console.error("Error logging interaction:", error.message);
    }
}

exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find();
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ msg: "Movie not found" });
        
        if (req.user) {
             await logInteraction(req.user, 'TRAILER_WATCH', movie._id);
        }

        res.status(200).json(movie);
    } catch (err) {
        res.status(500).json({ error: "Server error or invalid ID format" });
    }
};

exports.searchMovies = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ msg: "Search query is required" });
        
        if (req.user) {
             await logInteraction(req.user, 'SEARCH', null, query);
        }

        const movies = await Movie.find({ title: { $regex: query, $options: "i" } });
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};