const User = require('../models/User');
const Farm = require('../models/Farm');
const SoilData = require('../models/SoilData');
const Recommendation = require('../models/Recommendation');

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Admin
const getStats = async (req, res) => {
  try {
    const [totalFarmers, totalFarms, totalRecommendations, totalSoilSubmissions] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Farm.countDocuments(),
      Recommendation.countDocuments(),
      SoilData.countDocuments(),
    ]);

    // Crop distribution
    const cropDistribution = await Farm.aggregate([
      { $group: { _id: '$cropType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent registrations (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentFarmers = await User.countDocuments({
      role: 'farmer',
      createdAt: { $gte: sevenDaysAgo },
    });

    res.json({
      totalFarmers,
      totalFarms,
      totalRecommendations,
      totalSoilSubmissions,
      recentFarmers,
      cropDistribution,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all farmers
// @route   GET /api/admin/users
// @access  Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'farmer' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all farms
// @route   GET /api/admin/farms
// @access  Admin
const getAllFarms = async (req, res) => {
  try {
    const farms = await Farm.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(farms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all recommendations
// @route   GET /api/admin/recommendations
// @access  Admin
const getAllRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.find()
      .populate('userId', 'name email')
      .populate('farmId', 'farmName location cropType')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all soil data submissions
// @route   GET /api/admin/soil
// @access  Admin
const getAllSoilData = async (req, res) => {
  try {
    const soilData = await SoilData.find()
      .populate('userId', 'name email')
      .populate('farmId', 'farmName cropType')
      .sort({ createdAt: -1 });
    res.json(soilData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStats, getAllUsers, getAllFarms, getAllRecommendations, getAllSoilData };
