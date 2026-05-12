const express = require('express');
const router = express.Router();
const {
  generateRec,
  getRecommendations,
  getRecommendationsByFarm,
  getLatestRecommendation,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/generate', generateRec);
router.get('/', getRecommendations);
router.get('/latest', getLatestRecommendation);
router.get('/:farmId', getRecommendationsByFarm);

module.exports = router;
