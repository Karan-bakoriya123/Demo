const IoTStatus = require('../models/IoTStatus');
const Farm = require('../models/Farm');

// @desc    Update IoT device status (called by ESP8266)
// @route   POST /api/iot/update
// @access  Public (or protected by simple API key in future)
exports.updateStatus = async (req, res) => {
  try {
    const { farmId, moistureLevel, motorStatus } = req.body;

    if (!farmId || moistureLevel === undefined || motorStatus === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    // Verify farm exists
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    const status = await IoTStatus.create({
      farmId,
      moistureLevel,
      motorStatus,
    });

    res.status(201).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error updating IoT status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get latest IoT status for a farm (called by React)
// @route   GET /api/iot/:farmId
// @access  Protected
exports.getStatus = async (req, res) => {
  try {
    const { farmId } = req.params;

    // Get the most recent status
    const latestStatus = await IoTStatus.findOne({ farmId }).sort({ createdAt: -1 });

    if (!latestStatus) {
      return res.status(404).json({ success: false, message: 'No IoT data found for this farm' });
    }

    res.status(200).json({
      success: true,
      data: latestStatus,
    });
  } catch (error) {
    console.error('Error fetching IoT status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
