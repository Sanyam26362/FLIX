const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false }, 
  googleId: { type: String },
  profilePic: { type: String },
  genres: [{ type: String }], // RENAMED FROM interests
  preferredLanguage: { type: String, default: 'English' }, // ADDED FIELD
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);