const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile } = require("../controllers/userController");
const router = express.Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

module.exports = router;
