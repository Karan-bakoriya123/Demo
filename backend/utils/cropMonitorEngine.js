/**
 * Crop Monitor Engine
 * Computes all monitoring metrics for a given crop + soil + weather combination
 */

const { getCropData } = require('./cropDatabase');

/**
 * Compute current growth stage and progress
 */
const computeGrowthStage = (cropData, plantingDate) => {
  const now = new Date();
  const planting = new Date(plantingDate);
  const daysElapsed = Math.max(0, Math.floor((now - planting) / (1000 * 60 * 60 * 24)));
  const totalDays = cropData.totalDays;
  const daysRemaining = Math.max(0, totalDays - daysElapsed);
  const progress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));

  // Find current stage
  let currentStage = cropData.stages[cropData.stages.length - 1];
  let currentStageIndex = cropData.stages.length - 1;
  for (let i = 0; i < cropData.stages.length; i++) {
    const s = cropData.stages[i];
    if (daysElapsed >= s.startDay && daysElapsed <= s.endDay) {
      currentStage = s;
      currentStageIndex = i;
      break;
    }
  }

  // Stage progress within current stage
  const stageElapsed = daysElapsed - currentStage.startDay;
  const stageDuration = currentStage.endDay - currentStage.startDay;
  const stageProgress = Math.min(100, Math.round((stageElapsed / stageDuration) * 100));

  const isHarvested = daysElapsed >= totalDays;

  return {
    daysElapsed,
    daysRemaining,
    totalDays,
    progress,
    currentStage,
    currentStageIndex,
    stageProgress,
    stages: cropData.stages,
    isHarvested,
    plantingDate: planting.toISOString(),
    estimatedHarvestDate: new Date(planting.getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * Compute water requirements
 */
const computeWaterNeed = (cropData, soilMoisture, weather, growthStage, motorActive = false) => {
  const stageWaterMap = { low: 0.6, moderate: 1.0, high: 1.4, very_high: 1.8 };
  const stageMultiplier = stageWaterMap[growthStage.currentStage?.waterNeed] || 1.0;
  const dailyNeed = Math.round(cropData.waterPerDay * stageMultiplier * 10) / 10;

  const optMinMoisture = cropData.optimalMoisture?.min || 40;
  const optMaxMoisture = cropData.optimalMoisture?.max || 65;

  const rainChance = weather?.rainChance || 0;
  const rainfall = weather?.precipitation || 0;

  let status = 'Optional';
  let urgency = 'normal';
  let deficit = 0;
  let messageHi = '';
  let messageEn = '';
  let litersPerAcre = 0;

  // Calculate moisture deficit
  if (soilMoisture < optMinMoisture) {
    deficit = optMinMoisture - soilMoisture;
  }

  // ── Motor/Pump is currently ON (Irrigating) ──────────────────────────────
  if (motorActive) {
    status = 'Irrigating';
    urgency = 'irrigating';
    messageHi = `💧 पंप चल रहा है। मिट्टी की नमी: ${soilMoisture}%। सिंचाई जारी है।`;
    messageEn = `💧 Pump is ON. Soil moisture: ${soilMoisture}%. Irrigation in progress.`;
  } else if (rainChance > 60 || soilMoisture > optMaxMoisture) {
    status = 'Not Required';
    urgency = 'none';
    messageHi = soilMoisture > optMaxMoisture
      ? `मिट्टी में पर्याप्त नमी है (${soilMoisture}%)। सिंचाई की जरूरत नहीं।`
      : `${rainChance}% बारिश की संभावना। सिंचाई न करें।`;
    messageEn = soilMoisture > optMaxMoisture
      ? `Soil moisture is adequate (${soilMoisture}%). No irrigation needed.`
      : `${rainChance}% rain chance expected. Skip irrigation today.`;
  } else if (soilMoisture < 25 && rainChance < 30) {
    status = 'Critical';
    urgency = 'critical';
    deficit = optMinMoisture - soilMoisture;
    litersPerAcre = Math.round(deficit * 404.686 * 10) / 10;
    messageHi = `⚠️ मिट्टी बहुत सूखी है (${soilMoisture}%)! तुरंत सिंचाई करें। ${litersPerAcre} लीटर/एकड़ चाहिए।`;
    messageEn = `⚠️ Soil critically dry (${soilMoisture}%)! Immediate irrigation needed. ${litersPerAcre} liters/acre required.`;
  } else if (soilMoisture < optMinMoisture && rainChance < 40) {
    status = 'Required';
    urgency = 'high';
    litersPerAcre = Math.round(deficit * 404.686 * 10) / 10;
    messageHi = `मिट्टी में नमी कम है (${soilMoisture}%)। आज सिंचाई करें। ${litersPerAcre} लीटर/एकड़ चाहिए।`;
    messageEn = `Soil moisture low (${soilMoisture}%). Irrigate today. ${litersPerAcre} liters/acre needed.`;
  } else {
    status = 'Optional';
    urgency = 'low';
    messageHi = `मिट्टी की नमी ठीक है (${soilMoisture}%)। कल नमी चेक करें।`;
    messageEn = `Soil moisture is OK (${soilMoisture}%). Monitor tomorrow.`;
  }

  // Calculate estimated days until next irrigation
  const moistureDropPerDay = 5 * stageMultiplier;
  let nextIrrigationDays = 0;
  if (soilMoisture > optMinMoisture) {
    nextIrrigationDays = Math.max(0, Math.ceil((soilMoisture - optMinMoisture) / moistureDropPerDay));
  }

  return {
    status,
    urgency,
    motorActive,
    deficit: Math.round(deficit),
    dailyNeed,
    litersPerAcre,
    currentMoisture: soilMoisture,
    optimalRange: cropData.optimalMoisture,
    nextIrrigationDays,
    messageHi,
    messageEn,
  };
};



/**
 * Compute pesticide schedule
 */
const computePesticideNeed = (cropData, plantingDate, daysElapsed, recentActivities = []) => {
  const schedule = cropData.pesticideSchedule || [];

  // Find overdue and upcoming
  const overdue = schedule.filter(s => s.day <= daysElapsed && s.day >= daysElapsed - 10);
  const upcoming = schedule
    .filter(s => s.day > daysElapsed)
    .map(s => ({ ...s, daysUntil: s.day - daysElapsed }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const recentPesticide = recentActivities.find(a => a.activityType === 'Pesticide' && (Date.now() - new Date(a.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000);
  if (recentPesticide) {
    overdue.length = 0; // Clear overdue if recently applied
  }

  const nextSchedule = upcoming[0] || null;
  const isOverdue = overdue.length > 0;
  const isUrgent = nextSchedule && nextSchedule.daysUntil <= 7 && !recentPesticide;

  let messageHi = '';
  let messageEn = '';

  if (isOverdue) {
    messageHi = `⚠️ ${overdue[0].nameHi} की जरूरत थी (दिन ${overdue[0].day})। जल्दी करें!`;
    messageEn = `⚠️ ${overdue[0].type} was due (day ${overdue[0].day}). Apply immediately!`;
  } else if (nextSchedule) {
    if (isUrgent) {
      messageHi = `${nextSchedule.daysUntil} दिन में ${nextSchedule.nameHi} की जरूरत है।`;
      messageEn = `${nextSchedule.type} needed in ${nextSchedule.daysUntil} days.`;
    } else {
      messageHi = `अगला ${nextSchedule.nameHi} ${nextSchedule.daysUntil} दिन बाद (दिन ${nextSchedule.day})।`;
      messageEn = `Next ${nextSchedule.type} in ${nextSchedule.daysUntil} days (day ${nextSchedule.day}).`;
    }
  } else {
    messageHi = 'इस सीजन का सभी कीटनाशक स्प्रे पूरा हो चुका है।';
    messageEn = 'All pesticide sprays for this season are done.';
  }

  return {
    needed: isOverdue || isUrgent,
    urgency: isOverdue ? 'critical' : isUrgent ? 'high' : 'low',
    overdue,
    upcoming,
    nextSchedule,
    allSchedule: schedule,
    messageHi,
    messageEn,
  };
};

/**
 * Compute temperature impact
 */
const computeTempImpact = (cropData, currentTemp) => {
  const opt = cropData.optimalTemp;
  const crit = cropData.criticalTemp;

  let status = 'optimal';
  let messageHi = '';
  let messageEn = '';
  let deviation = 0;

  if (currentTemp < crit.min || currentTemp > crit.max) {
    status = 'danger';
    deviation = currentTemp < crit.min ? crit.min - currentTemp : currentTemp - crit.max;
    messageHi = currentTemp < crit.min
      ? `🥶 तापमान बहुत कम (${currentTemp}°C)! फसल को नुकसान हो सकता है।`
      : `🔥 तापमान बहुत अधिक (${currentTemp}°C)! फसल झुलस सकती है।`;
    messageEn = currentTemp < crit.min
      ? `Temperature too low (${currentTemp}°C)! Crop damage risk.`
      : `Temperature too high (${currentTemp}°C)! Heat stress risk.`;
  } else if (currentTemp < opt.min || currentTemp > opt.max) {
    status = 'warning';
    deviation = currentTemp < opt.min ? opt.min - currentTemp : currentTemp - opt.max;
    messageHi = currentTemp < opt.min
      ? `🌡️ तापमान थोड़ा कम है (${currentTemp}°C)। सामान्य ${opt.min}-${opt.max}°C है।`
      : `🌡️ तापमान थोड़ा अधिक है (${currentTemp}°C)। सामान्य ${opt.min}-${opt.max}°C है।`;
    messageEn = currentTemp < opt.min
      ? `Temperature slightly low (${currentTemp}°C). Optimal: ${opt.min}-${opt.max}°C.`
      : `Temperature slightly high (${currentTemp}°C). Optimal: ${opt.min}-${opt.max}°C.`;
  } else {
    status = 'optimal';
    messageHi = `✅ तापमान बिल्कुल सही है (${currentTemp}°C)। फसल अच्छी बढ़ेगी।`;
    messageEn = `Temperature is perfect (${currentTemp}°C). Excellent for crop growth.`;
  }

  return {
    current: currentTemp,
    optimal: opt,
    critical: crit,
    status,
    deviation: Math.round(deviation),
    messageHi,
    messageEn,
  };
};

/**
 * Compute overall crop health score (0–100)
 */
const computeCropHealth = (cropData, soilData, weather, growthStage, waterNeed, tempImpact) => {
  let score = 100;
  const factors = [];
  const risks = [];

  // Soil moisture factor
  const optMin = cropData.optimalMoisture?.min || 40;
  const optMax = cropData.optimalMoisture?.max || 65;
  if (soilData.soilMoisture < optMin - 15) {
    score -= 20;
    factors.push({ icon: '💧', label: 'Severe drought stress', labelHi: 'गंभीर सूखा तनाव', severity: 'high' });
    risks.push('drought');
  } else if (soilData.soilMoisture < optMin) {
    score -= 10;
    factors.push({ icon: '💧', label: 'Mild moisture deficit', labelHi: 'हल्की नमी कमी', severity: 'medium' });
  } else if (soilData.soilMoisture > optMax + 15) {
    score -= 15;
    factors.push({ icon: '🌊', label: 'Waterlogging risk', labelHi: 'जलभराव का खतरा', severity: 'high' });
    risks.push('waterlogging');
  }

  // pH factor
  const phMin = cropData.optimalPH?.min || 6.0;
  const phMax = cropData.optimalPH?.max || 7.5;
  if (soilData.soilPH < phMin - 0.5 || soilData.soilPH > phMax + 0.5) {
    score -= 15;
    factors.push({ icon: '⚗️', label: `Soil pH out of range (${soilData.soilPH})`, labelHi: `मिट्टी pH ठीक नहीं (${soilData.soilPH})`, severity: 'medium' });
  }

  // Nutrient factors
  if (soilData.nitrogen < 20) {
    score -= 10;
    factors.push({ icon: '🧪', label: 'Low Nitrogen (N)', labelHi: 'नाइट्रोजन कम है', severity: 'medium' });
  }
  if (soilData.phosphorus < 10) {
    score -= 8;
    factors.push({ icon: '🧪', label: 'Low Phosphorus (P)', labelHi: 'फास्फोरस कम है', severity: 'medium' });
  }
  if (soilData.potassium < 10) {
    score -= 8;
    factors.push({ icon: '🧪', label: 'Low Potassium (K)', labelHi: 'पोटेशियम कम है', severity: 'medium' });
  }

  // Temperature factor
  if (tempImpact.status === 'danger') {
    score -= 20;
    risks.push('heat_stress');
    factors.push({ icon: '🌡️', label: `Dangerous temperature (${tempImpact.current}°C)`, labelHi: `तापमान खतरनाक (${tempImpact.current}°C)`, severity: 'high' });
  } else if (tempImpact.status === 'warning') {
    score -= 8;
    factors.push({ icon: '🌡️', label: `Suboptimal temperature (${tempImpact.current}°C)`, labelHi: `तापमान ठीक नहीं (${tempImpact.current}°C)`, severity: 'medium' });
  }

  // Weather factor
  if (weather?.rainChance > 80 && weather?.description?.includes('storm')) {
    score -= 10;
    risks.push('storm');
    factors.push({ icon: '⛈️', label: 'Storm risk', labelHi: 'तूफान का खतरा', severity: 'high' });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let status = 'Excellent';
  let statusHi = 'बहुत अच्छी';
  let riskLevel = 'Low';
  let riskHi = 'कम';
  let statusColor = '#22c55e';

  if (score >= 80) { status = 'Excellent'; statusHi = 'बहुत अच्छी'; riskLevel = 'Low'; riskHi = 'कम'; statusColor = '#22c55e'; }
  else if (score >= 60) { status = 'Good'; statusHi = 'अच्छी'; riskLevel = 'Low'; riskHi = 'कम'; statusColor = '#84cc16'; }
  else if (score >= 40) { status = 'Moderate'; statusHi = 'ठीक'; riskLevel = 'Medium'; riskHi = 'मध्यम'; statusColor = '#f59e0b'; }
  else if (score >= 20) { status = 'Poor'; statusHi = 'खराब'; riskLevel = 'High'; riskHi = 'अधिक'; statusColor = '#f97316'; }
  else { status = 'Critical'; statusHi = 'गंभीर'; riskLevel = 'High'; riskHi = 'बहुत अधिक'; statusColor = '#ef4444'; }

  return { score, status, statusHi, riskLevel, riskHi, statusColor, factors, risks };
};

/**
 * Generate prioritized decisions for the farmer
 */
const generateDecisions = (health, water, pesticide, temp, growthStage, rain) => {
  const decisions = [];

  // Critical rain alert
  if (rain?.alertLevel === 'danger') {
    decisions.push({
      priority: 1, type: 'alert', severity: 'critical',
      icon: '⛈️', titleHi: 'भारी बारिश आने वाली है!', titleEn: 'Heavy Rain Incoming!',
      messageHi: rain.alertMessageHi, messageEn: rain.alertMessage,
      action: 'rain_alert', sound: true,
    });
  }

  // Water critical
  if (water.urgency === 'critical') {
    decisions.push({
      priority: 2, type: 'irrigation', severity: 'critical',
      icon: '💧', titleHi: 'तुरंत सिंचाई करें!', titleEn: 'Irrigate Immediately!',
      messageHi: water.messageHi, messageEn: water.messageEn,
      action: 'irrigate',
    });
  }

  // Temperature danger
  if (temp.status === 'danger') {
    decisions.push({
      priority: 3, type: 'temperature', severity: 'critical',
      icon: '🌡️', titleHi: 'तापमान खतरनाक!', titleEn: 'Dangerous Temperature!',
      messageHi: temp.messageHi, messageEn: temp.messageEn,
      action: 'temp_action',
    });
  }

  // Pesticide overdue
  if (pesticide.overdue?.length > 0) {
    decisions.push({
      priority: 4, type: 'pesticide', severity: 'high',
      icon: '🧪', titleHi: 'कीटनाशक लगाना जरूरी!', titleEn: 'Pesticide Application Due!',
      messageHi: pesticide.messageHi, messageEn: pesticide.messageEn,
      action: 'spray',
    });
  }

  // Water required (non-critical)
  if (water.urgency === 'high') {
    decisions.push({
      priority: 5, type: 'irrigation', severity: 'high',
      icon: '💧', titleHi: 'आज सिंचाई करें', titleEn: 'Irrigate Today',
      messageHi: water.messageHi, messageEn: water.messageEn,
      action: 'irrigate',
    });
  }

  // Rain warning — skip irrigation
  if (rain?.alertLevel === 'warning') {
    decisions.push({
      priority: 6, type: 'rain', severity: 'medium',
      icon: '🌧️', titleHi: 'बारिश की चेतावनी', titleEn: 'Rain Warning',
      messageHi: rain.alertMessageHi, messageEn: rain.alertMessage,
      action: 'prepare',
    });
  }

  // Upcoming pesticide
  if (pesticide.nextSchedule?.daysUntil <= 7 && !pesticide.overdue?.length) {
    decisions.push({
      priority: 7, type: 'pesticide', severity: 'medium',
      icon: '🧪', titleHi: `${pesticide.nextSchedule.daysUntil} दिन में ${pesticide.nextSchedule.nameHi}`,
      titleEn: `${pesticide.nextSchedule.type} in ${pesticide.nextSchedule.daysUntil} days`,
      messageHi: pesticide.messageHi, messageEn: pesticide.messageEn,
      action: 'prepare_spray',
    });
  }

  // Harvest approaching
  if (growthStage.daysRemaining <= 14 && growthStage.daysRemaining > 0) {
    decisions.push({
      priority: 8, type: 'harvest', severity: 'medium',
      icon: '🌾', titleHi: `${growthStage.daysRemaining} दिन में कटाई!`, titleEn: `Harvest in ${growthStage.daysRemaining} days!`,
      messageHi: `फसल पकने वाली है। कटाई की तैयारी शुरू करें।`,
      messageEn: `Crop is nearly ready. Start preparing for harvest.`,
      action: 'prepare_harvest',
    });
  }

  // Health poor
  if (health.score < 50) {
    decisions.push({
      priority: 9, type: 'health', severity: 'high',
      icon: '⚠️', titleHi: 'फसल स्वास्थ्य खराब', titleEn: 'Crop Health Poor',
      messageHi: `स्वास्थ्य स्कोर: ${health.score}/100। समस्याएं: ${health.factors.map(f => f.labelHi).join(', ')}`,
      messageEn: `Health score: ${health.score}/100. Issues: ${health.factors.map(f => f.label).join(', ')}`,
      action: 'check_crop',
    });
  }

  // All good
  if (decisions.length === 0) {
    decisions.push({
      priority: 99, type: 'good', severity: 'none',
      icon: '✅', titleHi: 'सब ठीक है!', titleEn: 'All Good!',
      messageHi: 'फसल की स्थिति अच्छी है। नियमित निगरानी जारी रखें।',
      messageEn: 'Crop condition is good. Continue regular monitoring.',
      action: 'monitor',
    });
  }

  return decisions.sort((a, b) => a.priority - b.priority);
};

module.exports = { computeGrowthStage, computeWaterNeed, computePesticideNeed, computeTempImpact, computeCropHealth, generateDecisions };
