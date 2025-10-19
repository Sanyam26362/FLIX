const express = require("express");
const auth = require("../middleware/authMiddleware");
const apiKeyAuth = require("../middleware/apiKeyAuth"); 
const { getRecommendations, addRecommendations } = require("../controllers/recommendationController");
const router = express.Router();

router.get("/", auth, getRecommendations);

router.post("/", apiKeyAuth, addRecommendations); 

module.exports = router;
