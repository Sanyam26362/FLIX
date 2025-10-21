const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile, addInterests } = require("../controllers/userController");
const router = express.Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);

router.post("/interests", auth, addInterests); 

module.exports = router;