// routes/authRoutes.js
const express = require("express");
const passport = require("passport"); // ADDED
const jwt = require("jsonwebtoken"); // ADDED
const { signup, login } = require("../controllers/authController");
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// NEW: Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// NEW: Google Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/signin", 
    session: false,
  }),
  (req, res) => {
    // Success Handler: Generate JWT and redirect to frontend
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    
    // Redirect to Vansh's frontend with the token in the URL
    res.redirect(`http://localhost:3000/dashboard?token=${token}`);
  }
);

module.exports = router;