const express = require('express');
const router = express.Router();
const { getCropMonitor } = require('../controllers/cropMonitorController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCropMonitor);

module.exports = router;
