// ====================================================================
// --- controllers/authController.js ---
// ====================================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.signup = async (req, res) => {
    try {
        // req.body must be successfully parsed by express.json() middleware
        const { name, email, password } = req.body; 
        
        // Input validation to prevent crashes if essential fields are truly missing
        if (!name || !email || !password) {
             return res.status(400).json({ msg: "Please provide name, email, and password." });
        }
        
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user, password hash is stored but NOT returned (due to select: false in model)
        user = await User.create({ name, email, password: hashedPassword });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        // Return only essential user data
        res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token }); 
    } catch (err) {
        // Generic 500 error handler
        res.status(500).json({ error: "Server Error during signup: " + err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch user, explicitly selecting the password hash
        const user = await User.findOne({ email }).select('+password'); 
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        
        // Return only essential user data
        res.status(200).json({ user: { id: user._id, name: user.name, email: user.email }, token });
    } catch (err) {
        res.status(500).json({ error: "Server Error during login: " + err.message });
    }
};