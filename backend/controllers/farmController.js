const Farm = require('../models/Farm');
const FarmActivity = require('../models/FarmActivity');
const SoilData = require('../models/SoilData');
const Recommendation = require('../models/Recommendation');
const { generateRecommendation } = require('../utils/recommendationEngine');
const { analyzeData } = require('../utils/assistantEngine');

// @desc    Create a new farm
// @route   POST /api/farms
// @access  Private (farmer)
const createFarm = async (req, res) => {
  try {
    const { farmName, location, cropType, soilType, fieldSize, fieldSizeUnit, plantingDate } = req.body;

    const farm = await Farm.create({
      userId: req.user._id,
      farmName,
      location,
      cropType,
      soilType,
      fieldSize,
      fieldSizeUnit: fieldSizeUnit || 'acres',
      plantingDate: plantingDate ? new Date(plantingDate) : new Date(),
    });

    res.status(201).json({ message: 'Farm created successfully', farm });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all farms for logged-in farmer
// @route   GET /api/farms
// @access  Private (farmer)
const getFarms = async (req, res) => {
  try {
    const farms = await Farm.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single farm by ID
// @route   GET /api/farms/:id
// @access  Private (farmer)
const getFarmById = async (req, res) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, userId: req.user._id });
    if (!farm) return res.status(404).json({ message: 'Farm not found' });
    res.json(farm);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update farm
// @route   PUT /api/farms/:id
// @access  Private (farmer)
const updateFarm = async (req, res) => {
  try {
    const farm = await Farm.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!farm) return res.status(404).json({ message: 'Farm not found' });
    res.json({ message: 'Farm updated successfully', farm });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete farm
// @route   DELETE /api/farms/:id
// @access  Private (farmer)
const deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!farm) return res.status(404).json({ message: 'Farm not found' });
    res.json({ message: 'Farm deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add farm activity
// @route   POST /api/farms/:id/activities
// @access  Private (farmer)
const addFarmActivity = async (req, res) => {
  try {
    const { activityType, notes } = req.body;
    const farm = await Farm.findOne({ _id: req.params.id, userId: req.user._id });
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    const activity = await FarmActivity.create({
      farmId: farm._id,
      userId: req.user._id,
      activityType,
      notes
    });

    if (activityType === 'Irrigation') {
      const latestSoil = await SoilData.findOne({ farmId: farm._id }).sort({ createdAt: -1 });
      if (latestSoil) {
        latestSoil.soilMoisture = 80;
        await latestSoil.save();
        
        const input = {
          cropType: farm.cropType,
          soilMoisture: latestSoil.soilMoisture,
          soilPH: latestSoil.soilPH,
          nitrogen: latestSoil.nitrogen,
          phosphorus: latestSoil.phosphorus,
          potassium: latestSoil.potassium,
          temperature: 28,
          humidity: 60,
          rainChance: 10,
          fieldSize: farm.fieldSize,
        };
        const recResult = generateRecommendation(input);
        const assistantMessage = analyzeData(input);
        await Recommendation.create({
          userId: req.user._id,
          farmId: farm._id,
          soilDataId: latestSoil._id,
          weatherData: { temperature: 28, humidity: 60, rainChance: 10 },
          ...recResult,
          assistantMessage
        });
      }
    }

    res.status(201).json({ message: 'Activity logged successfully', activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get farm activities
// @route   GET /api/farms/:id/activities
// @access  Private (farmer)
const getFarmActivities = async (req, res) => {
  try {
    const activities = await FarmActivity.find({ farmId: req.params.id, userId: req.user._id }).sort({ createdAt: -1 }).limit(10);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createFarm, getFarms, getFarmById, updateFarm, deleteFarm, addFarmActivity, getFarmActivities };
