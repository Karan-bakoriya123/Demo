const Farm = require('../models/Farm');
const SoilData = require('../models/SoilData');
const IoTStatus = require('../models/IoTStatus');
const FarmActivity = require('../models/FarmActivity');
const axios = require('axios');
const { getCropData } = require('../utils/cropDatabase');
const {
  computeGrowthStage,
  computeWaterNeed,
  computePesticideNeed,
  computeTempImpact,
  computeCropHealth,
  generateDecisions,
} = require('../utils/cropMonitorEngine');

// Geocoding helper (reused from weatherController)
const searchIndia = async (query) => {
  try {
    const res = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`
    );
    if (res.data?.results) {
      return res.data.results.find(r => r.country_code === 'IN' || r.country === 'India') || null;
    }
  } catch (_) {}
  return null;
};

const getCoords = async (location) => {
  let loc = await searchIndia(location);
  if (!loc) {
    const parts = location.trim().split(/[\s,]+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].length <= 2) continue;
      loc = await searchIndia(parts[i]);
      if (loc) break;
    }
  }
  return loc;
};

// @desc  Get full crop monitoring data for a farm
// @route GET /api/crop-monitor?farmId=xxx
// @access Private
const getCropMonitor = async (req, res) => {
  try {
    const { farmId } = req.query;

    // Get all user farms if no farmId
    let farm;
    if (farmId) {
      farm = await Farm.findOne({ _id: farmId, userId: req.user._id });
    } else {
      farm = await Farm.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    }

    if (!farm) {
      return res.status(404).json({ message: 'No farm found. Please add a farm first.' });
    }

    // ── Get latest IoT (real-time) data from ESP8266 ──────────────────────
    const iotData = await IoTStatus.findOne({ farmId: farm._id }).sort({ createdAt: -1 });
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);   // pump data every 1s
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);  // display freshness
    const isIotFresh = iotData && new Date(iotData.createdAt) > twoMinutesAgo;
    const isIotRecent = iotData && new Date(iotData.createdAt) > tenMinutesAgo;

    // ── Get latest manual soil data ──────────────────────────────────────
    const soilData = await SoilData.findOne({ farmId: farm._id }).sort({ createdAt: -1 }).lean();
    const defaultSoil = { soilMoisture: 50, soilPH: 6.5, nitrogen: 30, phosphorus: 20, potassium: 20 };
    const manualSoil = soilData || defaultSoil;

    // Priority: IoT (fresh) > Manual SoilData > Default
    // This ensures only moisture is overridden by ESP8266, rest of NPK/pH remains manual!
    const soil = {
      ...manualSoil,
      soilMoisture: isIotFresh ? iotData.moistureLevel : manualSoil.soilMoisture,
    };

    // Motor/pump status from IoT
    const motorActive = isIotFresh ? iotData.motorStatus : false;
    const soilSource = isIotFresh ? 'iot' : (isIotRecent ? 'iot_stale' : (soilData ? 'manual' : 'default'));
    const iotLastUpdated = iotData ? iotData.createdAt : null;

    // ── Check last auto-logged irrigation (from IoT pump off event) ───────
    const lastIoTIrrigation = await FarmActivity.findOne({
      farmId: farm._id,
      activityType: 'Irrigation',
      notes: { $regex: 'IoT Auto' },
    }).sort({ createdAt: -1 });
    const lastIrrigatedAt = lastIoTIrrigation ? lastIoTIrrigation.createdAt : null;


    // Get crop knowledge
    const cropData = getCropData(farm.cropType);

    // Planting date fallback
    const plantingDate = farm.plantingDate || farm.createdAt;

    // Compute growth stage
    const growthStage = computeGrowthStage(cropData, plantingDate);

    // Fetch weather
    let weather = null;
    let rainAlert = null;
    const location = farm.location;
    const locData = await getCoords(location);

    if (locData) {
      const { latitude: lat, longitude: lon } = locData;
      try {
        // Current weather
        const wRes = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`
        );
        const cur = wRes.data.current;
        const code = cur.weather_code;
        const getDesc = (c) => {
          if (c === 0) return 'Clear sky';
          if (c <= 3) return 'Partly cloudy';
          if (c <= 48) return 'Fog';
          if (c <= 55) return 'Drizzle';
          if (c <= 65) return 'Rain';
          if (c <= 77) return 'Snow';
          if (c <= 99) return 'Thunderstorm';
          return 'Clear';
        };
        weather = {
          temperature: Math.round(cur.temperature_2m),
          feelsLike: Math.round(cur.apparent_temperature),
          humidity: cur.relative_humidity_2m,
          windSpeed: Math.round(cur.wind_speed_10m),
          precipitation: cur.precipitation,
          description: getDesc(code),
          weatherCode: code,
          rainChance: cur.precipitation > 0 ? 80 : (code >= 50 ? 50 : 10),
          location: `${locData.name}, India`,
        };

        // 7-day forecast + rain alert
        const fRes = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation,weather_code&daily=precipitation_sum,precipitation_probability_max,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
        );
        const { daily, hourly } = fRes.data;

        // Build daily forecast
        const forecast7Day = [];
        for (let i = 0; i < daily.time.length; i++) {
          const d = new Date(daily.time[i] + 'T00:00:00');
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          forecast7Day.push({
            date: daily.time[i],
            day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
            dayHi: i === 0 ? 'आज' : i === 1 ? 'कल' : days[d.getDay()],
            rainProbability: daily.precipitation_probability_max[i] || 0,
            rainAmount: Math.round((daily.precipitation_sum[i] || 0) * 10) / 10,
            tempMax: Math.round(daily.temperature_2m_max[i]),
            tempMin: Math.round(daily.temperature_2m_min[i]),
            isRainDay: (daily.precipitation_probability_max[i] || 0) >= 40,
          });
        }

        // Rain alert logic
        const currentHour = new Date().getHours();
        const next3Hours = hourly.precipitation_probability.slice(currentHour, currentHour + 4);
        const imminentProb = Math.max(...next3Hours, 0);
        const todayMaxProb = daily.precipitation_probability_max[0] || 0;

        let alertLevel = 'none';
        let alertMessageHi = '☀️ आज बारिश नहीं होगी।';
        let alertMessage = 'No rain expected today.';

        if (imminentProb >= 70) {
          alertLevel = 'danger';
          alertMessageHi = `⚠️ अगले 1-3 घंटे में भारी बारिश! संभावना: ${imminentProb}%`;
          alertMessage = `Heavy rain in next 1-3 hours! Probability: ${imminentProb}%`;
        } else if (todayMaxProb >= 60) {
          alertLevel = 'warning';
          alertMessageHi = `🌧️ आज बारिश की संभावना (${todayMaxProb}%)।`;
          alertMessage = `Rain likely today (${todayMaxProb}% chance).`;
        } else if (todayMaxProb >= 35) {
          alertLevel = 'watch';
          alertMessageHi = `🌦️ हल्की बारिश हो सकती है (${todayMaxProb}%)।`;
          alertMessage = `Possible light rain today (${todayMaxProb}% chance).`;
        }

        rainAlert = { alertLevel, alertMessage, alertMessageHi, todayMaxProb, imminentProb, forecast7Day };
      } catch (wErr) {
        console.error('Weather fetch error:', wErr.message);
      }
    }

    // Fallback weather
    if (!weather) {
      weather = { temperature: 28, humidity: 60, windSpeed: 15, precipitation: 0, description: 'Clear', rainChance: 10, location: location };
    }

    // Compute all metrics
    const tempImpact = computeTempImpact(cropData, weather.temperature);
    const waterNeed = computeWaterNeed(cropData, soil.soilMoisture, weather, growthStage, motorActive);
    const recentActivities = await FarmActivity.find({ farmId: farm._id }).sort({ createdAt: -1 }).limit(10);
    const pesticideNeed = computePesticideNeed(cropData, plantingDate, growthStage.daysElapsed, recentActivities);
    const cropHealth = computeCropHealth(cropData, soil, weather, growthStage, waterNeed, tempImpact);
    const decisions = generateDecisions(cropHealth, waterNeed, pesticideNeed, tempImpact, growthStage, rainAlert);

    // Get all farms for selector
    const allFarms = await Farm.find({ userId: req.user._id }).select('_id farmName cropType location plantingDate');

    res.json({
      farm: {
        _id: farm._id,
        farmName: farm.farmName,
        cropType: farm.cropType,
        cropNameHi: cropData.nameHi,
        cropEmoji: cropData.emoji,
        location: farm.location,
        fieldSize: farm.fieldSize,
        fieldSizeUnit: farm.fieldSizeUnit,
        soilType: farm.soilType,
        plantingDate: plantingDate,
      },
      allFarms,
      health: cropHealth,
      growth: growthStage,
      water: waterNeed,
      pesticide: pesticideNeed,
      temperature: tempImpact,
      harvest: {
        daysRemaining: growthStage.daysRemaining,
        estimatedDate: growthStage.estimatedHarvestDate,
        readiness: growthStage.progress,
        isHarvested: growthStage.isHarvested,
      },
      weather,
      rainAlert,
      soil: {
        moisture: soil.soilMoisture,
        pH: soil.soilPH,
        nitrogen: soil.nitrogen,
        phosphorus: soil.phosphorus,
        potassium: soil.potassium,
        hasData: !!soilData,
        source: soilSource,
      },
      iot: {
        active: isIotFresh,
        recent: isIotRecent,
        motorOn: motorActive,
        lastUpdated: iotLastUpdated,
        moistureLevel: (isIotFresh || isIotRecent) ? iotData?.moistureLevel : null,
        lastIrrigatedAt: lastIrrigatedAt,
      },
      decisions,
      fetchedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Crop monitor error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCropMonitor };
