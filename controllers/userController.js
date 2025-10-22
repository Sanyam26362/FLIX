
const User = require("../models/User");
const Interaction = require("../models/Interaction");
const Bookmark = require("../models/Bookmark");
const Movie = require("../models/Movie");
const axios = require('axios'); 

const YASHASVI_ML_INPUT_ENDPOINT = "http://yashasvi-ml-service.com/calculate"; 

const triggerInitialRecommendations = async (user) => {
    const interactions = await Interaction.find({ user: user._id }).select('type movie query').limit(200); 
    const bookmarks = await Bookmark.find({ user: user._id }).select('movie');

    const allMovieMongoIds = [
        ...interactions.map(i => i.movie),
        ...bookmarks.map(b => b.movie)
    ].filter(id => id != null);
    
    const historicalMovies = await Movie.find({ _id: { $in: allMovieMongoIds } }).select('id _id');
    const mongoIdToExternalId = new Map(historicalMovies.map(m => [m._id.toString(), m.id]));

    const watched_ids = [];
    const bookmarked_movies = [];
    const searchedQueries = [];

    interactions.forEach(i => {
        const externalId = mongoIdToExternalId.get(i.movie.toString());
        if (i.type === 'TRAILER_WATCH' && externalId) {
            watched_ids.push(externalId);
        } else if (i.type === 'SEARCH' && i.query) {
             searchedQueries.push(i.query); 
        }
    });

    bookmarks.forEach(b => {
        const externalId = mongoIdToExternalId.get(b.movie.toString());
        if (externalId) {
            bookmarked_movies.push(externalId);
        }
    });
    
    const genresString = user.genres ? user.genres.join(' ') : "";


    const finalMlPayload = {
        watched_ids: watched_ids,
        searched_ids: searchedQueries,
        bookmarked_movies: bookmarked_movies,
        genres: genresString,
        language: user.preferredLanguage || 'English'
    };

    console.log(`[ML Trigger] Final Payload for ML Service: ${JSON.stringify(finalMlPayload)}`);

    try {
        if (!YASHASVI_ML_INPUT_ENDPOINT || YASHASVI_ML_INPUT_ENDPOINT.includes("http://yashasvi-ml-service.com")) {
             console.error("[ML Trigger] ML Endpoint is placeholder. Skipping external API call.");
             return;
        }
        
        const mlResponse = await axios.post(
            YASHASVI_ML_INPUT_ENDPOINT, 
            finalMlPayload
        );
        
        console.log("[ML Trigger] Received recommendations. Pushing to DB.");

        const storeResponse = await axios.post(
            `http://localhost:${process.env.PORT || 5000}/api/recommendations`,
            {
                userId: user._id.toString(),
                recommendations: mlResponse.data.recommendations,
                bookmarked_movies: mlResponse.data.bookmarked_movies
            },
            {
                headers: { 'X-API-Key': process.env.DATA_SERVICE_API_KEY } 
            }
        );

        console.log(`[ML Trigger] Recommendations stored in DB. Status: ${storeResponse.status}`);

    } catch (error) {
        console.error(" Error during ML communication or storage:", error.message);
    }
};



exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-googleId -createdAt -__v -password');
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => { 
    try {
        const { name, genres, profilePic, preferredLanguage } = req.body;
        const updates = { name, genres, profilePic, preferredLanguage };

        const updatedUser = await User.findByIdAndUpdate(
            req.user,
            updates,
            { new: true, runValidators: true } 
        ).select('-googleId -createdAt -__v -password');

        if (!updatedUser) return res.status(404).json({ msg: "User not found" });

        res.status(200).json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addInterests = async (req, res) => {
    try {
        const { genres, preferredLanguage } = req.body;

        if (!genres || !Array.isArray(genres) || genres.length === 0) {
            return res.status(400).json({ msg: "Genres must be provided as a non-empty array." });
        }
        if (!preferredLanguage) {
            return res.status(400).json({ msg: "Preferred language is required." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user, 
            { genres: genres, preferredLanguage: preferredLanguage },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "User not found" });
        }

        await triggerInitialRecommendations(updatedUser); 

        res.status(200).json({ 
            msg: "Profile saved successfully. Recommendations generating.", 
            user: updatedUser 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
