const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { signup, login } = require("../controllers/authController");
const auth = require("../middleware/authMiddleware"); 
const router = express.Router();


router.post("/signup", signup);
router.post("/login", login);


router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/signin",
    session: false, 
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
  }
);


router.post("/logout", auth, (req, res) => {
  try {
    
    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully. Please remove JWT token from client storage.",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
