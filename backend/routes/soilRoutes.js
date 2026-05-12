const express = require('express');
const router = express.Router();
const { submitSoilData, getSoilDataByFarm, getLatestSoilData } = require('../controllers/soilController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', submitSoilData);
router.get('/:farmId', getSoilDataByFarm);
router.get('/:farmId/latest', getLatestSoilData);

module.exports = router;
