const express = require("express");
const auth = require("../middleware/authMiddleware");
const mlAuth = require("../middleware/mlAuth"); // You must create this
const { getRecommendations, addRecommendations } = require("../controllers/recommendationController");
const router = express.Router();

router.get("/", auth, getRecommendations);
router.post("/", mlAuth, addRecommendations); // SECURED HERE

module.exports = router;