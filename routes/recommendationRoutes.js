const express = require('express');
const router = express.Router();
const { 
    receiveRecommendationsFromML, 
    getRecommendationsByUser,     
    
} = require('../controllers/recommendationController'); 


router.post('/', receiveRecommendationsFromML); 

router.get('/:userId', getRecommendationsByUser);

module.exports = router;