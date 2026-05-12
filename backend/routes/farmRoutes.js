const express = require('express');
const router = express.Router();
const { createFarm, getFarms, getFarmById, updateFarm, deleteFarm, addFarmActivity, getFarmActivities } = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getFarms).post(createFarm);
router.route('/:id').get(getFarmById).put(updateFarm).delete(deleteFarm);
router.route('/:id/activities').get(getFarmActivities).post(addFarmActivity);

module.exports = router;
