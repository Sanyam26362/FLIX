const User = require("../models/User");
const Interaction = require("../models/Interaction");
const Bookmark = require("../models/Bookmark");
const Movie = require("../models/Movie");

// Helper for ML payload construction
const triggerInitialRecommendations = async (user) => {
const hasFullProfile = user.genres && user.genres.length > 0 && user.preferredLanguage;

let mlPayload = { userId: user._id };

if (hasFullProfile) {
    mlPayload.type = 'INITIAL';
    mlPayload.data = { 
        genres: user.genres,
        preferredLanguage: user.preferredLanguage
    };
    console.log(`[ML Trigger] New User Payload (Genres/Lang): ${JSON.stringify(mlPayload)}`);
} else {
    mlPayload.type = 'HISTORY';
    
    const interactions = await Interaction.find({ user: user._id }).select('type movie query').limit(100); 
    const bookmarks = await Bookmark.find({ user: user._id }).select('movie');

    const movieIds = [
        ...interactions.filter(i => i.type === 'TRAILER_WATCH').map(i => i.movie),
        ...bookmarks.map(b => b.movie)
    ].filter(id => id != null);
    
    const historicalMovies = await Movie.find({ _id: { $in: movieIds } }).select('id imdb_id');
    
    const historyData = historicalMovies.map(movie => ({
        mongoId: movie._id,
        id: movie.id, 
        imdb_id: movie.imdb_id
    }));

    mlPayload.data = {
        genres: user.genres || [],
        preferredLanguage: user.preferredLanguage || 'English',
        searchedQueries: interactions.filter(i => i.type === 'SEARCH').map(i => i.query).filter(q => q),
        movieHistory: historyData 
    };
    console.log(`[ML Trigger] Historical Payload: ${JSON.stringify(mlPayload)}`);
}

// TODO: Implement the actual API call to Yashasvi's service here
console.log(`[ML Trigger] Sent request to ML Service for user: ${user._id}`);


};

// ====================================================================
// EXPORTED FUNCTIONS
// ====================================================================

exports.getProfile = async (req, res) => {
try {
const user = await User.findById(req.user).select('-googleId -createdAt -__v -password');
if (!user) return res.status(404).json({ msg: "User not found" });
res.status(200).json(user);
} catch (err) {
res.status(500).json({ error: err.message });
}
};

exports.updateProfile = async (req, res) => { // <-- EXPORT IS CORRECT HERE
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