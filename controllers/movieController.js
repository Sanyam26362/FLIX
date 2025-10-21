// ====================================================================
// --- controllers/movieController.js (FINALIZED & OPTIMIZED) ---
// ====================================================================
const Movie = require("../models/Movie");
const Interaction = require("../models/Interaction"); 

// Helper function to log interactions
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
        // NOTE: This endpoint returns all movies. Use with caution on large datasets.
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
        
        // Log interaction if user is logged in
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
        
        // Log interaction if user is logged in
        if (req.user) {
             await logInteraction(req.user, 'SEARCH', null, query);
        }

        // SOLUTION: Uses the fast text index ($text) and limits results.
        const movies = await Movie.find(
            // Uses the text index created earlier for maximum speed
            { $text: { $search: query } } 
        )
        .limit(100); // CRITICAL: Limits the payload size to prevent server freezing

        // Fallback: If the indexed text search returns nothing, try the slower regex (last resort)
        if (movies.length === 0) {
            const fallbackMovies = await Movie.find({ title: { $regex: query, $options: "i" } })
                .limit(50);
            return res.status(200).json(fallbackMovies);
        }

        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};