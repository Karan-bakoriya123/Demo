const IoTStatus = require('../models/IoTStatus');
const Farm = require('../models/Farm');
const FarmActivity = require('../models/FarmActivity');

// @desc    Update IoT device status (called by ESP8266)
// @route   POST /api/iot/update
// @access  Public
exports.updateStatus = async (req, res) => {
  try {
    const { farmId, moistureLevel, moisture, motorStatus } = req.body;

    // Support both field names
    const finalMoisture = moistureLevel !== undefined ? moistureLevel : moisture;

    // Convert "on"/"off" string → Boolean
    const finalMotorStatus = typeof motorStatus === 'string'
      ? (motorStatus.toLowerCase() === 'on')
      : motorStatus;

    if (!farmId || finalMoisture === undefined || motorStatus === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    // Verify farm exists and get userId
    const farm = await Farm.findById(farmId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found' });
    }

    // ── Smart Irrigation: Check if pump just turned OFF (irrigation complete) ──
    const previousStatus = await IoTStatus.findOne({ farmId }).sort({ createdAt: -1 });
    const pumpWasOn = previousStatus?.motorStatus === true;
    const pumpNowOff = finalMotorStatus === false;

    // If pump was ON before and is now OFF → irrigation cycle completed!
    if (pumpWasOn && pumpNowOff) {
      // Check: was there already an irrigation logged in last 5 minutes?
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentLog = await FarmActivity.findOne({
        farmId,
        activityType: 'Irrigation',
        createdAt: { $gte: fiveMinAgo },
        notes: { $regex: 'IoT Auto' }
      });

      if (!recentLog) {
        // Auto-log irrigation completed
        await FarmActivity.create({
          farmId,
          userId: farm.userId,
          activityType: 'Irrigation',
          notes: `IoT Auto: Pump OFF. Moisture reached ${finalMoisture}%. Irrigation complete.`,
        });
        console.log(`✅ IoT: Irrigation auto-logged for farm ${farmId}`);
      }
    }

    // Save latest sensor reading
    const status = await IoTStatus.create({
      farmId,
      moistureLevel: finalMoisture,
      motorStatus: finalMotorStatus,
    });

    res.status(201).json({
      success: true,
      data: status,
      irrigationLogged: pumpWasOn && pumpNowOff,
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
    const latestStatus = await IoTStatus.findOne({ farmId }).sort({ createdAt: -1 });

    if (!latestStatus) {
      return res.status(404).json({ success: false, message: 'No IoT data found for this farm' });
    }

    res.status(200).json({ success: true, data: latestStatus });
  } catch (error) {
    console.error('Error fetching IoT status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
