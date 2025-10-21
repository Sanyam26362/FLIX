const express = require("express");
const auth = require("../middleware/authMiddleware");
const { getProfile, updateProfile, addInterests } = require("../controllers/userController"); // <-- ENSURE THIS IS CORRECT
const router = express.Router();

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile); // <-- THIS ROUTE WAS FAILING
router.post("/interests", auth, addInterests);

module.exports = router;