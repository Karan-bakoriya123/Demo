const express = require('express');
const router = express.Router();
const { getStats, getAllUsers, getAllFarms, getAllRecommendations, getAllSoilData } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.get('/farms', getAllFarms);
router.get('/recommendations', getAllRecommendations);
router.get('/soil', getAllSoilData);

module.exports = router;
