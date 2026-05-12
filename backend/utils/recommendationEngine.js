/**
 * Rule-based Recommendation Engine
 * Returns structured irrigation and crop health recommendations
 */

const generateRecommendation = ({
  cropType,
  soilMoisture,
  soilPH,
  nitrogen,
  phosphorus,
  potassium,
  temperature,
  humidity,
  rainChance,
  fieldSize,
  recentActivities = [],
}) => {
  let irrigationStatus = 'Optional';
  let reason = '';
  let bestTime = 'Any time';
  let cropHealthStatus = 'Good';
  let riskLevel = 'Low';

  // ─── Irrigation Status ─────────────────────────────────────────────────────
  if (rainChance > 60) {
    irrigationStatus = 'Not Required';
    reason = `Rain is expected with ${rainChance}% probability. Natural rainfall should provide sufficient water for the ${cropType} crop.`;
  } else if (soilMoisture > 70) {
    irrigationStatus = 'Not Required';
    reason = `Soil moisture is already high at ${soilMoisture}%. Adding more water may cause waterlogging and root diseases.`;
  } else if (soilMoisture < 30 && rainChance < 40) {
    irrigationStatus = 'Required';
    reason = `Soil moisture is critically low at ${soilMoisture}% and rain probability is only ${rainChance}%. Immediate irrigation is required to prevent crop stress.`;
  } else if (soilMoisture >= 30 && soilMoisture <= 60) {
    irrigationStatus = 'Optional';
    reason = `Soil moisture is moderate at ${soilMoisture}%. Monitor over the next 24 hours and irrigate if it drops below 30%.`;
  } else {
    irrigationStatus = 'Optional';
    reason = `Soil moisture level is ${soilMoisture}%. Continue monitoring the crop.`;
  }

  // Override if recently irrigated
  const recentIrrigation = recentActivities.find(a => a.activityType === 'Irrigation' && (Date.now() - new Date(a.createdAt).getTime()) < 24 * 60 * 60 * 1000);
  if (recentIrrigation) {
    irrigationStatus = 'Not Required';
    reason = `You recently irrigated the field. No need for additional watering right now.`;
  }

  // ─── Best Irrigation Time ──────────────────────────────────────────────────
  if (temperature > 35) {
    bestTime = 'Early Morning (5 AM – 8 AM) or Evening (6 PM – 8 PM)';
  } else if (temperature > 25) {
    bestTime = 'Morning (6 AM – 10 AM)';
  } else if (temperature < 10) {
    bestTime = 'Midday (10 AM – 2 PM)';
  } else {
    bestTime = 'Morning (6 AM – 10 AM)';
  }

  // ─── Crop Health Status ────────────────────────────────────────────────────
  const phIssue = soilPH < 5.5 || soilPH > 8.5;
  const moistureIssue = soilMoisture < 20 || soilMoisture > 80;
  const nutrientIssue = nitrogen < 20 || phosphorus < 10 || potassium < 10;

  const issueCount = [phIssue, moistureIssue, nutrientIssue].filter(Boolean).length;

  if (issueCount === 0) {
    cropHealthStatus = 'Good';
    riskLevel = 'Low';
  } else if (issueCount === 1) {
    cropHealthStatus = 'Moderate';
    riskLevel = 'Medium';
  } else {
    cropHealthStatus = 'Poor';
    riskLevel = 'High';
  }

  // High temperature adds risk
  if (temperature > 40) {
    riskLevel = 'High';
    if (cropHealthStatus === 'Good') cropHealthStatus = 'Moderate';
  }

  return {
    irrigationStatus,
    reason,
    bestTime,
    cropHealthStatus,
    riskLevel,
  };
};

module.exports = { generateRecommendation };
