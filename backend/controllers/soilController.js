const SoilData = require('../models/SoilData');
const Farm = require('../models/Farm');

// @desc    Submit soil data
// @route   POST /api/soil
// @access  Private (farmer)
const submitSoilData = async (req, res) => {
  try {
    const { farmId, soilMoisture, soilPH, nitrogen, phosphorus, potassium } = req.body;

    // Verify farm belongs to user
    const farm = await Farm.findOne({ _id: farmId, userId: req.user._id });
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const soilData = await SoilData.create({
      userId: req.user._id,
      farmId,
      soilMoisture,
      soilPH,
      nitrogen,
      phosphorus,
      potassium,
    });

    res.status(201).json({ message: 'Soil data submitted successfully', soilData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get soil data for a farm
// @route   GET /api/soil/:farmId
// @access  Private (farmer)
const getSoilDataByFarm = async (req, res) => {
  try {
    const soilData = await SoilData.find({
      farmId: req.params.farmId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(soilData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest soil data for a farm
// @route   GET /api/soil/:farmId/latest
// @access  Private (farmer)
const getLatestSoilData = async (req, res) => {
  try {
    const soilData = await SoilData.findOne({
      farmId: req.params.farmId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    if (!soilData) return res.status(404).json({ message: 'No soil data found for this farm' });
    res.json(soilData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { submitSoilData, getSoilDataByFarm, getLatestSoilData };
