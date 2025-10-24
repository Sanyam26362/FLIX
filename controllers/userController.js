const User = require("../models/User");
const Interaction = require("../models/Interaction");
const Bookmark = require("../models/Bookmark");
const Movie = require("../models/Movie");
const axios = require("axios");
const mongoose = require('mongoose'); 

const YASHASVI_ML_INPUT_ENDPOINT = process.env.YASHASVI_ML_INPUT_ENDPOINT;
const DATA_SERVICE_API_KEY = process.env.DATA_SERVICE_API_KEY;


const triggerInitialRecommendations = async (user) => {
  try {
    const latestUser = await User.findById(user._id);
    if (!latestUser) {
        console.error("[ML Trigger] Could not refetch user for latest history.");
        return; 
    }
    const watched_ids = latestUser.watchHistory || []; 

    const bookmarks = await Bookmark.find({ user: user._id }).select("movie"); 
    const bookmarkedMongoIds = bookmarks.map((b) => b.movie).filter(id => id);

    const bookmarkedMoviesDocs = await Movie.find({ _id: { $in: bookmarkedMongoIds } }).select("id");
    const bookmarked_movies = bookmarkedMoviesDocs.map(m => m.id); 

    
    const interactions = await Interaction.find({ user: user._id, type: "SEARCH" })
      .sort({ createdAt: -1 }) 
      .limit(20) 
      .select("query");
    const searchedQueries = interactions.map(i => i.query).filter(q => q);


    const genresString = latestUser.genres ? latestUser.genres.join(" ") : "";

    const finalMlPayload = {
     
      watched_ids: watched_ids.map(id => Number(id)),
      searched_ids: searchedQueries, 
      bookmarked_movies: bookmarked_movies.map(id => Number(id)), 
      genres: genresString,
      language: latestUser.preferredLanguage || "English",
    };

    console.log(`[ML Trigger] Sending Payload to ML: ${JSON.stringify(finalMlPayload)}`);

    if (!YASHASVI_ML_INPUT_ENDPOINT || YASHASVI_ML_INPUT_ENDPOINT.includes("placeholder")) {
        console.error("[ML Trigger] ML Endpoint not set correctly. Skipping...");
        return;
    }

    const mlResponse = await axios.post( YASHASVI_ML_INPUT_ENDPOINT, finalMlPayload );
    let mlData = mlResponse.data;

     if (typeof mlData === 'string') {
        try {
            let cleanJsonString = mlData.trim().replace(/NaN/g, 'null');
            mlData = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error(" Failed to parse ML response string as JSON:", e.message, `Received: ${mlResponse.data}`);
            return; 
        }
    }
    if (!mlData.recommendations || !Array.isArray(mlData.recommendations)) {
        console.error(" Invalid ML response format. Missing 'recommendations' array.", `Received: ${JSON.stringify(mlData)}`);
        return; 
    }
    console.log(`[ML Trigger] Received ${mlData.recommendations.length} recommendations. Pushing to DB...`);
    if (mlData.recommendations.length > 0) {
        console.log(`[ML Trigger] First received rec: ID ${mlData.recommendations[0]?.id}, Title: ${mlData.recommendations[0]?.title}`);
    }

    const cleanedRecommendations = mlData.recommendations.filter( movie => movie && movie.id );
    const internalApiUrl = process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/api/recommendations` 
        : `http://localhost:${process.env.PORT || 5000}/api/recommendations`; 
    const cleanUserId = user._id.toString().trim();


    const storeResponse = await axios.post( internalApiUrl, {
            userId: cleanUserId,
            recommendations: cleanedRecommendations,
            bookmarked_movies: mlData.bookmarked_movies, 
        }, { headers: { "X-API-Key": DATA_SERVICE_API_KEY } } 
    );
    console.log(`[ML Trigger] Recommendations stored successfully via internal API. Status: ${storeResponse.status}`);


  } catch (error) {
   
     const source = error.config?.url === YASHASVI_ML_INPUT_ENDPOINT ? "ML Service Call" : "Internal API Call";
     const status = error.response ? `status code ${error.response.status}`: "network error or setup issue";
     const data = error.response ? JSON.stringify(error.response.data) : "No response data";
     console.error(` ${source} FAILED (${status}): ${error.message}. Response Data: ${data}`);
     if (error.request && !error.response) {
         console.error(" Request details:", error.config?.method, error.config?.url);
     }
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-googleId -createdAt -__v -password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, genres, profilePic, preferredLanguage } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (genres !== undefined) updates.genres = genres;
    if (profilePic !== undefined) updates.profilePic = profilePic;
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;


    const updatedUser = await User.findByIdAndUpdate(req.user, updates, {
      new: true,
      runValidators: true, 
    }).select("-googleId -createdAt -__v -password");

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
    ).select("-googleId -createdAt -__v -password"); 

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.status(200).json({
      msg: "Profile saved successfully. Recommendations generating.",
      user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email, 
          genres: updatedUser.genres,
          preferredLanguage: updatedUser.preferredLanguage,
          profilePic: updatedUser.profilePic
      }
    });

     setTimeout(() => {
        console.log("[Add Interests] Triggering recommendations update.");
        triggerInitialRecommendations(updatedUser).catch(err => {
             console.error(`[Add Interests] Background recommendation trigger failed: ${err.message}`);
        });
    }, 0);


  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user); 
    if (!user) { return res.status(404).json({ msg: 'User not found' }); }

    if (!user.watchHistory || user.watchHistory.length === 0) {
        return res.json([]); 
    }


    const movies = await Movie.find({
      'id': { $in: user.watchHistory } 
    });

    
    const movieMap = new Map(movies.map(m => [m.id, m]));
    const orderedMovies = user.watchHistory
        .map(id => movieMap.get(id))
        .filter(m => m); 

    res.json(orderedMovies.reverse());

  } catch (err) {
    console.error("Error fetching watch history:", err.message);
    res.status(500).send('Server Error');
  }
};

exports.addToWatchHistory = async (req, res) => {
  const { movieId } = req.body; 

  if (!movieId || typeof movieId !== 'number') {
    return res.status(400).json({ msg: 'Numeric Movie ID (external) is required.' });
  }

  try {
    const user = await User.findById(req.user);
    if (!user) { return res.status(404).json({ msg: 'User not found' }); }

    user.watchHistory = user.watchHistory.filter(id => id !== movieId); 
    user.watchHistory.push(movieId); 

   

    await user.save(); 

 
    setTimeout(() => {
        console.log(`[Watch History Add] Triggering recommendations update for user: ${user._id}`);
        triggerInitialRecommendations(user).catch(err => {
             console.error(`[Watch History Add] Background recommendation trigger failed: ${err.message}`);
        });
    }, 0);

   
    res.json(user.watchHistory);

  } catch (err) {
    console.error("Error adding to watch history:", err.message);
    res.status(500).send('Server Error');
  }
};

