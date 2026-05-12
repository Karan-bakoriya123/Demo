const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    soilType: {
      type: String,
      required: [true, 'Soil type is required'],
    },
    fieldSize: {
      type: Number,
      required: [true, 'Field size is required'],
      min: 0,
    },
    fieldSizeUnit: {
      type: String,
      enum: ['acres', 'hectares'],
      default: 'acres',
    },
    plantingDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Farm', farmSchema);
