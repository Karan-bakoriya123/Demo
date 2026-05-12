const express = require('express');
const router = express.Router();
const { updateStatus, getStatus } = require('../controllers/iotController');
const { protect } = require('../middleware/authMiddleware');

// Public route for hardware (ESP8266)
router.post('/update', updateStatus);

// Protected route for frontend dashboard
router.get('/:farmId', protect, getStatus);

module.exports = router;
