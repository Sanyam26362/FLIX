const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { signup, login } = require("../controllers/authController");
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
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
    
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
    }
);

module.exports = router;
