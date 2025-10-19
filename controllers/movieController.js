const Movie = require("../models/Movie");

exports.getAllMovies = async (req, res) => {
    try {
        const movies = await Movie.find().limit(50); 
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};

exports.getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).json({ msg: "Movie not found" });
        res.status(200).json(movie);
    } catch (err) {
        res.status(500).json({ error: "Server Error or Invalid ID: " + err.message });
    }
};

exports.searchMovies = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            const popularMovies = await Movie.find().limit(20); 
            return res.status(200).json(popularMovies);
        }

        const movies = await Movie.find({ title: { $regex: query, $options: "i" } }).limit(50);
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: "Server Error: " + err.message });
    }
};
