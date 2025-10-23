const User = require("../models/User");
const Interaction = require("../models/Interaction");
const Bookmark = require("../models/Bookmark");
const Movie = require("../models/Movie");
const axios = require("axios");

const YASHASVI_ML_INPUT_ENDPOINT = process.env.YASHASVI_ML_INPUT_ENDPOINT;
const DATA_SERVICE_API_KEY = process.env.DATA_SERVICE_API_KEY;


const triggerInitialRecommendations = async (user) => {
  try {
    const interactions = await Interaction.find({ user: user._id })
      .select("type movie query")
      .limit(200);
    const bookmarks = await Bookmark.find({ user: user._id }).select("movie");

    const allMovieMongoIds = [
      ...interactions.map((i) => i.movie),
      ...bookmarks.map((b) => b.movie),
    ].filter((id) => id != null);

    const historicalMovies = await Movie.find({
      _id: { $in: allMovieMongoIds }, 
    }).select("id _id");
    
    const mongoIdToExternalId = new Map(
      historicalMovies.map((m) => [m._id.toString(), m.id])
    );

    const watched_ids = [];
    const bookmarked_movies = [];
    const searchedQueries = [];

    interactions.forEach((i) => {
      const externalId = mongoIdToExternalId.get(i.movie?.toString());
      if (i.type === "TRAILER_WATCH" && externalId) {
        watched_ids.push(Number(externalId));
      } else if (i.type === "SEARCH" && i.query) {
        searchedQueries.push(i.query);
      }
    });

    bookmarks.forEach((b) => {
      const externalId = mongoIdToExternalId.get(b.movie?.toString());
      if (externalId) bookmarked_movies.push(Number(externalId));
    });

    const genresString = user.genres ? user.genres.join(" ") : "";

    const finalMlPayload = {
      watched_ids,
      searched_ids: searchedQueries,
      bookmarked_movies,
      genres: genresString,
      language: user.preferredLanguage || "English",
    };

    console.log(`[ML Trigger] Sending Payload to ML: ${JSON.stringify(finalMlPayload)}`);

    if (
      !YASHASVI_ML_INPUT_ENDPOINT ||
      YASHASVI_ML_INPUT_ENDPOINT.includes("placeholder")
    ) {
      console.error("[ML Trigger] ML Endpoint not set correctly. Skipping...");
      return;
    }
    
    const mlResponse = await axios.post(
      YASHASVI_ML_INPUT_ENDPOINT, 
      finalMlPayload
    );
    let mlData = mlResponse.data;

    if (typeof mlData === 'string') {
        try {
            let cleanJsonString = mlData.trim();
            cleanJsonString = cleanJsonString.replace(/NaN/g, 'null');
            
            mlData = JSON.parse(cleanJsonString);
        } catch (e) {
            console.error("❌ Failed to parse ML response string as JSON:", e.message);
            console.error(`Received unparsed string: ${mlResponse.data}`);
            return; 
        }
    }

    if (!mlData.recommendations || !Array.isArray(mlData.recommendations)) {
      console.error("❌ Invalid ML response format. Missing recommendations.");
      console.error(`Received data: ${JSON.stringify(mlData)}`); 
      return;
    }

    console.log("[ML Trigger] Received recommendations. Pushing to DB...");

    const cleanedRecommendations = mlData.recommendations.filter(
      (movie) => movie && movie.id
    );

    const internalApiUrl = process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL}/api/recommendations`
      : `http://localhost:${process.env.PORT || 5000}/api/recommendations`;

    const cleanUserId = user._id.toString().trim();

    const storeResponse = await axios.post(
      internalApiUrl,
      {
        userId: cleanUserId, 
        recommendations: cleanedRecommendations,
        bookmarked_movies: mlData.bookmarked_movies,
      },
      {
        headers: { "X-API-Key": DATA_SERVICE_API_KEY },
      }
    );

    console.log(`[ML Trigger] Recommendations stored successfully. Status: ${storeResponse.status}`);
  } catch (error) {
    const status = error.response
      ? `status code ${error.response.status}`
      : "network error";
    const data = error.response ? JSON.stringify(error.response.data) : "No response data";
      
    console.error(`❌ ML Service Call FAILED (${status}): ${error.message}. Response Data: ${data}`);
  }
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select(
      "-googleId -createdAt -__v -password"
    );
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
      return res
        .status(400)
        .json({ msg: "Genres must be provided as a non-empty array." });
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
      user: updatedUser,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};