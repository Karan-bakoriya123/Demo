const express = require('express');
const router = express.Router();
const { scanLeaf, scanSoil } = require('../controllers/scannerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/leaf', protect, scanLeaf);
router.post('/soil', protect, scanSoil);

module.exports = router;
