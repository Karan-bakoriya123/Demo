const mongoose = require('mongoose');

const soilDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
    },
    soilMoisture: {
      type: Number,
      required: [true, 'Soil moisture is required'],
      min: 0,
      max: 100,
    },
    soilPH: {
      type: Number,
      required: [true, 'Soil pH is required'],
      min: 0,
      max: 14,
    },
    nitrogen: {
      type: Number,
      required: [true, 'Nitrogen level is required'],
      min: 0,
    },
    phosphorus: {
      type: Number,
      required: [true, 'Phosphorus level is required'],
      min: 0,
    },
    potassium: {
      type: Number,
      required: [true, 'Potassium level is required'],
      min: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SoilData', soilDataSchema);
