/**
 * Rule-based AI Assistant Engine
 * Generates farmer-friendly advice based on soil, weather, and crop data
 */

const analyzeData = ({
  cropType,
  soilMoisture,
  soilPH,
  temperature,
  humidity,
  rainChance,
  fieldSize,
  recentActivities = [],
}) => {
  const messages = [];
  let irrigationAdvice = '';
  let soilAdvice = '';
  let weatherAdvice = '';
  let timingAdvice = '';

  // ─── Irrigation Logic ──────────────────────────────────────────────────────
  if (rainChance > 60) {
    irrigationAdvice = `Good news! Rain is expected soon (${rainChance}% chance), so you do NOT need to irrigate your ${cropType} crop today. Save your water and wait for the rain.`;
  } else if (soilMoisture > 70) {
    irrigationAdvice = `Your soil already has plenty of moisture (${soilMoisture}%). Avoid irrigation right now to prevent waterlogging and root damage in your ${cropType} crop.`;
  } else if (soilMoisture < 30 && rainChance < 40) {
    irrigationAdvice = `Your ${cropType} crop needs irrigation today! Soil moisture is very low (${soilMoisture}%) and rain chances are also low (${rainChance}%). Irrigate as soon as possible to protect your crop.`;
  } else if (soilMoisture >= 30 && soilMoisture <= 60) {
    irrigationAdvice = `Soil moisture is at a moderate level (${soilMoisture}%) for your ${cropType} crop. Monitor the soil for the next 24 hours. Irrigate if moisture drops below 30%.`;
  } else {
    irrigationAdvice = `Soil moisture is at ${soilMoisture}%. Keep monitoring and irrigate your ${cropType} crop if it drops further.`;
  }

  // Override if recently irrigated
  const recentIrrigation = recentActivities.find(a => a.activityType === 'Irrigation' && (Date.now() - new Date(a.createdAt).getTime()) < 24 * 60 * 60 * 1000);
  if (recentIrrigation) {
    irrigationAdvice = `Since you just irrigated recently, you can skip watering today despite current soil/weather readings.`;
  }
  
  messages.push(irrigationAdvice);

  // ─── Soil pH Analysis ──────────────────────────────────────────────────────
  if (soilPH < 6) {
    soilAdvice = `⚠️ Warning: Your soil is acidic (pH ${soilPH}). This can reduce nutrient availability for ${cropType}. Consider adding lime to raise the pH for better crop health.`;
    messages.push(soilAdvice);
  } else if (soilPH > 8) {
    soilAdvice = `⚠️ Warning: Your soil is alkaline (pH ${soilPH}). High pH can make it harder for ${cropType} to absorb nutrients. Adding sulfur or organic matter can help balance the pH.`;
    messages.push(soilAdvice);
  } else {
    soilAdvice = `Soil pH is ${soilPH}, which is suitable for ${cropType} growth. Keep it in this range for best results.`;
    messages.push(soilAdvice);
  }

  // ─── Temperature & Timing Advice ───────────────────────────────────────────
  if (temperature > 35) {
    timingAdvice = `🌡️ It's very hot today (${temperature}°C). If you need to irrigate, do it in the early morning (before 8 AM) or evening (after 6 PM) to reduce water evaporation and protect your ${cropType} plants from heat stress.`;
    messages.push(timingAdvice);
  } else if (temperature < 10) {
    timingAdvice = `🥶 Temperature is quite low (${temperature}°C). Irrigate during midday when it's warmer to avoid frost damage to your ${cropType} crop.`;
    messages.push(timingAdvice);
  }

  // ─── Humidity Analysis ─────────────────────────────────────────────────────
  if (humidity < 30) {
    weatherAdvice = `💨 Humidity is very low (${humidity}%). Your ${cropType} crop may lose water faster than usual due to dry air. Keep a closer eye on soil moisture levels.`;
    messages.push(weatherAdvice);
  } else if (humidity > 80) {
    weatherAdvice = `💧 Humidity is high (${humidity}%). Watch out for fungal diseases in your ${cropType} crop. Ensure good air circulation and avoid over-watering.`;
    messages.push(weatherAdvice);
  }

  const recentPesticide = recentActivities.find(a => a.activityType === 'Pesticide');
  if (recentPesticide) {
    messages.push(`Note: You recently applied pesticide. Observe the crop for changes before applying more.`);
  }

  // ─── Field Size Context ────────────────────────────────────────────────────
  if (fieldSize > 10) {
    messages.push(`🌾 Your farm is large (${fieldSize} acres). Consider using drip irrigation or sprinkler systems for water efficiency.`);
  }

  // ─── Final Summary ─────────────────────────────────────────────────────────
  const finalMessage = messages.join(' ');
  return finalMessage;
};

module.exports = { analyzeData };
