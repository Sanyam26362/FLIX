// controllers/userController.js
const User = require("../models/User");

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