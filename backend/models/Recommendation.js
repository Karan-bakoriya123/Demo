const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
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
    soilDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SoilData',
      required: true,
    },
    weatherData: {
      temperature: Number,
      humidity: Number,
      rainChance: Number,
      windSpeed: Number,
      description: String,
      location: String,
    },
    irrigationStatus: {
      type: String,
      enum: ['Required', 'Not Required', 'Optional'],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    bestTime: {
      type: String,
      required: true,
    },
    cropHealthStatus: {
      type: String,
      enum: ['Good', 'Moderate', 'Poor'],
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true,
    },
    assistantMessage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recommendation', recommendationSchema);
