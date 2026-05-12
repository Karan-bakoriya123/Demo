const express = require('express');
const router = express.Router();
const { getWeather, getRainForecast } = require('../controllers/weatherController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWeather);
router.get('/rain-forecast', protect, getRainForecast);

module.exports = router;
