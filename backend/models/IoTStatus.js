const mongoose = require('mongoose');

const iotStatusSchema = new mongoose.Schema(
  {
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
    },
    moistureLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    motorStatus: {
      type: Boolean,
      required: true,
      default: false, // false = OFF, true = ON
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IoTStatus', iotStatusSchema);
