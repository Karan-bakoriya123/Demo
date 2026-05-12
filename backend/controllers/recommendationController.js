const Recommendation = require('../models/Recommendation');
const Farm = require('../models/Farm');
const SoilData = require('../models/SoilData');
const FarmActivity = require('../models/FarmActivity');
const { generateRecommendation } = require('../utils/recommendationEngine');
const { analyzeData } = require('../utils/assistantEngine');

// @desc    Generate recommendation from latest soil + weather data
// @route   POST /api/recommendations/generate
// @access  Private (farmer)
const generateRec = async (req, res) => {
  try {
    const { farmId, soilDataId, weatherData } = req.body;

    // Verify farm ownership
    const farm = await Farm.findOne({ _id: farmId, userId: req.user._id });
    if (!farm) return res.status(404).json({ message: 'Farm not found' });

    // Get soil data
    const soilData = await SoilData.findById(soilDataId);
    if (!soilData) return res.status(404).json({ message: 'Soil data not found' });

    const input = {
      cropType: farm.cropType,
      soilMoisture: soilData.soilMoisture,
      soilPH: soilData.soilPH,
      nitrogen: soilData.nitrogen,
      phosphorus: soilData.phosphorus,
      potassium: soilData.potassium,
      temperature: weatherData?.temperature || 25,
      humidity: weatherData?.humidity || 60,
      rainChance: weatherData?.rainChance || 20,
      fieldSize: farm.fieldSize,
    };

    const recentActivities = await FarmActivity.find({ farmId }).sort({ createdAt: -1 }).limit(3);
    input.recentActivities = recentActivities;

    const { irrigationStatus, reason, bestTime, cropHealthStatus, riskLevel } =
      generateRecommendation(input);

    const assistantMessage = analyzeData(input);

    const recommendation = await Recommendation.create({
      userId: req.user._id,
      farmId,
      soilDataId,
      weatherData: weatherData || {},
      irrigationStatus,
      reason,
      bestTime,
      cropHealthStatus,
      riskLevel,
      assistantMessage,
    });

    res.status(201).json({
      message: 'Recommendation generated successfully',
      recommendation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all recommendations for logged-in farmer
// @route   GET /api/recommendations
// @access  Private (farmer)
const getRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({ userId: req.user._id })
      .populate('farmId', 'farmName location cropType')
      .populate('soilDataId')
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recommendations for a specific farm
// @route   GET /api/recommendations/:farmId
// @access  Private (farmer)
const getRecommendationsByFarm = async (req, res) => {
  try {
    const recommendations = await Recommendation.find({
      farmId: req.params.farmId,
      userId: req.user._id,
    })
      .populate('farmId', 'farmName location cropType')
      .populate('soilDataId')
      .sort({ createdAt: -1 });

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest recommendation for farmer (dashboard)
// @route   GET /api/recommendations/latest
// @access  Private (farmer)
const getLatestRecommendation = async (req, res) => {
  try {
    const recommendation = await Recommendation.findOne({ userId: req.user._id })
      .populate('farmId', 'farmName location cropType fieldSize')
      .populate('soilDataId')
      .sort({ createdAt: -1 });

    if (!recommendation) return res.status(404).json({ message: 'No recommendations found yet' });
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateRec, getRecommendations, getRecommendationsByFarm, getLatestRecommendation };
