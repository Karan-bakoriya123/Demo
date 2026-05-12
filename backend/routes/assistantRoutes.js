const express = require('express');
const router = express.Router();
const { analyze } = require('../controllers/assistantController');
const { protect } = require('../middleware/authMiddleware');

router.post('/analyze', protect, analyze);

module.exports = router;
