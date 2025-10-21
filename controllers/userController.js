const User = require("../models/User");
const Interaction = require("../models/Interaction"); 
const Bookmark = require("../models/Bookmark"); 

const triggerInitialRecommendations = async (user) => {
    const hasInterests = user.interests && user.interests.length > 0;
    
    let mlPayload = { userId: user._id };

    if (hasInterests) {
        // SCENARIO 1: NEW USER - Send interests (COLD START)
        mlPayload.type = 'INITIAL';
        mlPayload.data = { interests: user.interests };
        console.log(`[ML Trigger] New User Payload (Interests): ${JSON.stringify(mlPayload)}`);
    } else {
        // SCENARIO 2: OLD USER - Send history 
        mlPayload.type = 'HISTORY';
        
        // Fetch recent interactions and bookmarks
        const interactions = await Interaction.find({ user: user._id })
            .select('type movie query') 
            .limit(50); 
        const bookmarks = await Bookmark.find({ user: user._id }).select('movie');

        mlPayload.data = {
            searchedQueries: interactions.filter(i => i.type === 'SEARCH').map(i => i.query).filter(q => q),
            watchedMovieIds: interactions.filter(i => i.type === 'TRAILER_WATCH').map(i => i.movie).filter(id => id !== null),
            bookmarkedMovieIds: bookmarks.map(b => b.movie)
        };
        console.log(`[ML Trigger] Historical Payload: ${JSON.stringify(mlPayload)}`);
    }

    // TODO: Implement the actual secure API call to Yashasvi's service here
    console.log(`[ML Trigger] Sent request to ML Service for user: ${user._id}`);
};


exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user).select('-googleId -createdAt -__v'); 
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, interests, profilePic } = req.body;
    const updates = { name, interests, profilePic };

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      updates,
      { new: true, runValidators: true } 
    ).select('-googleId -createdAt -__v');
    
    if (!updatedUser) return res.status(404).json({ msg: "User not found" });
    
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addInterests = async (req, res) => {
    try {
        const { interests } = req.body;
        
        if (!interests || !Array.isArray(interests) || interests.length === 0) {
            return res.status(400).json({ msg: "Interests must be provided as a non-empty array." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user, 
            { interests: interests },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ msg: "User not found." });
        }

        await triggerInitialRecommendations(updatedUser); 

        res.status(200).json({ 
            msg: "Interests saved successfully. Recommendations generating.", 
            user: updatedUser 
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};