const axios = require('axios');

// Map standard WMO weather codes to descriptions and icons
const getWeatherDesc = (code) => {
  if (code === 0) return { desc: 'Clear sky', icon: '01d' };
  if (code <= 3) return { desc: 'Partly cloudy', icon: '02d' };
  if (code <= 48) return { desc: 'Fog', icon: '50d' };
  if (code <= 55) return { desc: 'Drizzle', icon: '09d' };
  if (code <= 65) return { desc: 'Rain', icon: '10d' };
  if (code <= 77) return { desc: 'Snow', icon: '13d' };
  if (code <= 99) return { desc: 'Thunderstorm', icon: '11d' };
  return { desc: 'Clear', icon: '01d' };
};

// @desc    Get real-time weather data (Open-Meteo with exact Geocoding)
// @route   GET /api/weather?location=CityName
// @access  Private
const getWeather = async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ message: 'Location required' });
    }

    // Helper to Title Case user input
    const toTitleCase = (str) => str.replace(/\b\w/g, l => l.toUpperCase());
    
    // Helper to search and prioritize Indian locations
    const searchIndia = async (query) => {
      const res = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`);
      if (res.data?.results) {
        const indianResult = res.data.results.find(r => r.country_code === 'IN' || r.country === 'India');
        return indianResult || null; // Strictly India
      }
      return null;
    };

    // Step 1: Try exact match
    let locData = await searchIndia(location);
    
    // Step 2: Advanced Fallback (Extract district/village, ignore short codes like 'MP')
    if (!locData) {
      const parts = location.trim().split(/[\s,]+/);
      // Search words right-to-left to prioritize District over Village (since District has better weather data)
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].length <= 2) continue; // Skip 'MP', 'UP', 'in', etc.
        locData = await searchIndia(parts[i]);
        if (locData) break;
      }
    }

    if (!locData) {
      throw new Error("Location not found");
    }

    const lat = locData.latitude;
    const lon = locData.longitude;
    
    // Smart Naming: Show exact what user typed, but append State/Country
    let exactLocName = `${locData.name}, ${locData.country || 'India'}`;
    if (location.toLowerCase() !== locData.name.toLowerCase()) {
       if (location.toLowerCase().includes(locData.name.toLowerCase())) {
          exactLocName = `${toTitleCase(location)}, ${locData.country || 'India'}`;
       } else {
          exactLocName = `${toTitleCase(location)} (near ${locData.name}), ${locData.country || 'India'}`;
       }
    }

    // Step 2: Open-Meteo Forecast API (Real-Time 15-min updates)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,surface_pressure`;
    const weatherRes = await axios.get(weatherUrl);
    
    const current = weatherRes.data.current;
    const wmo = getWeatherDesc(current.weather_code);

    const weatherData = {
      location: exactLocName,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      rainChance: current.precipitation > 0 ? 80 : (current.weather_code >= 50 ? 50 : 10),
      description: wmo.desc,
      icon: wmo.icon,
      pressure: Math.round(current.surface_pressure),
      visibility: 10,
      isMock: false, // 100% REAL DATA
    };

    res.json(weatherData);
  } catch (error) {
    console.error('Weather error:', error.message);
    res.json({
      location: req.query.location || 'Unknown',
      temperature: 34, feelsLike: 36, humidity: 60, windSpeed: 24, rainChance: 10,
      description: 'Clear', icon: '01d', pressure: 1012, visibility: 10, isMock: true
    });
  }
};

// @desc    Get 7-day rain forecast with alerts
// @route   GET /api/weather/rain-forecast?location=CityName
// @access  Private
const getRainForecast = async (req, res) => {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ message: 'Location required' });
    }

    const toTitleCase = (str) => str.replace(/\b\w/g, l => l.toUpperCase());

    // Reuse same geocoding logic
    const searchIndia = async (query) => {
      const r = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10`);
      if (r.data?.results) {
        const indianResult = r.data.results.find(x => x.country_code === 'IN' || x.country === 'India');
        return indianResult || null; // Strictly India
      }
      return null;
    };

    let locData = await searchIndia(location);
    if (!locData) {
      const parts = location.trim().split(/[\s,]+/);
      for (let i = parts.length - 1; i >= 0; i--) {
        if (parts[i].length <= 2) continue;
        locData = await searchIndia(parts[i]);
        if (locData) break;
      }
    }

    if (!locData) throw new Error('Location not found');

    const lat = locData.latitude;
    const lon = locData.longitude;

    let exactLocName = `${locData.name}, ${locData.country || 'India'}`;
    if (location.toLowerCase() !== locData.name.toLowerCase()) {
      if (location.toLowerCase().includes(locData.name.toLowerCase())) {
        exactLocName = `${toTitleCase(location)}, ${locData.country || 'India'}`;
      } else {
        exactLocName = `${toTitleCase(location)} (near ${locData.name}), ${locData.country || 'India'}`;
      }
    }

    // Fetch hourly + daily forecast in one call
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,precipitation,weather_code&daily=precipitation_sum,precipitation_probability_max,weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    const forecastRes = await axios.get(forecastUrl);
    const { hourly, daily } = forecastRes.data;

    // === TODAY's HOURLY DATA (first 24 entries) ===
    const now = new Date();
    const currentHour = now.getHours();
    const hourlyToday = [];
    for (let i = 0; i < 24; i++) {
      hourlyToday.push({
        hour: i,
        time: `${i.toString().padStart(2, '0')}:00`,
        probability: hourly.precipitation_probability[i] || 0,
        precipitation: hourly.precipitation[i] || 0,
        weatherCode: hourly.weather_code[i] || 0,
      });
    }

    // === ANALYZE TODAY's RAIN ===
    // Past hours (already happened)
    const pastHours = hourlyToday.filter(h => h.hour < currentHour);
    const pastMaxProb = Math.max(...pastHours.map(h => h.probability), 0);
    const pastPrecip = pastHours.reduce((sum, h) => sum + h.precipitation, 0);
    const rainedAlready = pastPrecip > 0.5 || pastMaxProb >= 50;

    // Remaining hours (still coming)
    const remainingHours = hourlyToday.filter(h => h.hour >= currentHour);
    const remainingMaxProb = Math.max(...remainingHours.map(h => h.probability), 0);
    const peakHoursRemaining = remainingHours.filter(h => h.probability >= 50).map(h => h.time);
    const rainStillComing = remainingMaxProb >= 40;

    // Peak hours across full day (for display)
    const allPeakHours = hourlyToday.filter(h => h.probability >= 50).map(h => h.time);

    // Daily probability from Open-Meteo (whole day max)
    const dailyProbToday = daily.precipitation_probability_max[0] || 0;

    // Determine overall rain status
    let rainStatus = 'not_expected'; // no rain today
    if (rainStillComing) {
      rainStatus = 'coming_soon'; // rain still expected in remaining hours
    } else if (rainedAlready) {
      rainStatus = 'rained_already'; // rain happened earlier today, no more expected
    }

    // Time range
    let expectedTimeRange = '';
    if (peakHoursRemaining.length > 0) {
      expectedTimeRange = `${peakHoursRemaining[0]} - ${peakHoursRemaining[peakHoursRemaining.length - 1]}`;
    } else if (allPeakHours.length > 0) {
      expectedTimeRange = `${allPeakHours[0]} - ${allPeakHours[allPeakHours.length - 1]} (ho chuki)`;
    }

    // Intensity from total precipitation (whole day)
    const todayPrecipTotal = hourlyToday.reduce((sum, h) => sum + h.precipitation, 0);
    let intensity = 'none';
    if (todayPrecipTotal > 20) intensity = 'heavy';
    else if (todayPrecipTotal > 5) intensity = 'moderate';
    else if (todayPrecipTotal > 0.5) intensity = 'light';

    const todayRain = {
      willRain: dailyProbToday >= 40,              // whole day perspective
      probability: dailyProbToday,                  // daily max probability (full day)
      remainingProbability: remainingMaxProb,        // remaining hours only
      rainStatus,                                    // 'coming_soon' | 'rained_already' | 'not_expected'
      expectedTime: expectedTimeRange || 'N/A',
      intensity,
      totalPrecipitation: Math.round(todayPrecipTotal * 10) / 10,
      pastPrecipitation: Math.round(pastPrecip * 10) / 10,
    };

    // === 7-DAY DAILY FORECAST ===
    const dayNames = ['Ravivaar', 'Somvaar', 'Mangalvaar', 'Budhvaar', 'Guruvaar', 'Shukravaar', 'Shanivaar'];
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyForecast = [];
    for (let i = 0; i < daily.time.length; i++) {
      const d = new Date(daily.time[i] + 'T00:00:00');
      const wmo = getWeatherDesc(daily.weather_code[i]);
      dailyForecast.push({
        date: daily.time[i],
        dayHi: dayNames[d.getDay()],
        dayEn: dayNamesEn[d.getDay()],
        dateFormatted: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        rainProbability: daily.precipitation_probability_max[i] || 0,
        rainAmount: Math.round((daily.precipitation_sum[i] || 0) * 10) / 10,
        weatherCode: daily.weather_code[i],
        description: wmo.desc,
        icon: wmo.icon,
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        isRainDay: (daily.precipitation_probability_max[i] || 0) >= 40,
      });
    }

    // === NEXT RAIN IN (countdown) ===
    // If today's rain already passed (no more rain coming), skip today for countdown
    let nextRainIn = null;
    const skipToday = (rainStatus === 'rained_already' || rainStatus === 'not_expected');
    for (let i = 0; i < dailyForecast.length; i++) {
      if (i === 0 && skipToday) continue; // skip today if rain is over
      if (dailyForecast[i].isRainDay) {
        nextRainIn = {
          days: i,
          date: dailyForecast[i].dateFormatted,
          dayHi: dailyForecast[i].dayHi,
          dayEn: dailyForecast[i].dayEn,
          probability: dailyForecast[i].rainProbability,
        };
        break;
      }
    }

    // === ALERT LEVEL ===
    let alertLevel = 'none';
    let alertMessage = '';
    let alertMessageHi = '';

    // Check next 3 hours for imminent rain
    const next3Hours = hourlyToday.filter(h => h.hour >= currentHour && h.hour <= currentHour + 3);
    const imminentProb = Math.max(...next3Hours.map(h => h.probability), 0);

    if (imminentProb >= 70) {
      alertLevel = 'danger';
      alertMessage = `Heavy rain expected in next 1-3 hours! Probability: ${imminentProb}%`;
      alertMessageHi = `⚠️ अगले 1-3 घंटे में भारी बारिश आने वाली है! संभावना: ${imminentProb}%`;
    } else if (rainStillComing && remainingMaxProb >= 60) {
      alertLevel = 'warning';
      alertMessage = `Rain still expected today (${remainingMaxProb}% chance). Expected around ${expectedTimeRange || 'later today'}.`;
      alertMessageHi = `🌧️ आज बारिश अभी आने वाली है (${remainingMaxProb}%)। अनुमानित समय: ${expectedTimeRange || 'बाद में'}`;
    } else if (rainStillComing && remainingMaxProb >= 30) {
      alertLevel = 'watch';
      alertMessage = `Possible rain later today (${remainingMaxProb}% chance). Keep watching.`;
      alertMessageHi = `🌦️ आज बारिश की हल्की संभावना है (${remainingMaxProb}%)। ध्यान रखें।`;
    } else if (rainedAlready) {
      alertLevel = 'none';
      alertMessage = `Rain already happened today (${Math.round(pastPrecip * 10) / 10}mm). No more rain expected.`;
      alertMessageHi = `✅ आज बारिश हो चुकी है (${Math.round(pastPrecip * 10) / 10}mm)। अब और बारिश नहीं होगी।`;
    } else {
      alertLevel = 'none';
      alertMessage = 'No rain expected today. Clear skies ahead.';
      alertMessageHi = '☀️ आज बारिश नहीं होगी। साफ मौसम रहेगा।';
    }

    // === FARMING ADVICE ===
    const farmingAdvice = [];
    if (rainStatus === 'coming_soon') {
      farmingAdvice.push({ type: 'irrigation', text: '🚫 Aaj sinchai ki zaroorat nahi — Barish abhi aane wali hai', textEn: 'No irrigation needed — Rain is still expected today' });
      if (intensity === 'heavy') {
        farmingAdvice.push({ type: 'harvest', text: '🌾 Fasal ko jaldi cover karein — Bhaari barish se nuksan ho sakta hai', textEn: 'Cover crops quickly — Heavy rain may cause damage' });
        farmingAdvice.push({ type: 'protection', text: '🛡️ Drainage check karein — Paani bharne se fasal kharab ho sakti hai', textEn: 'Check drainage — Waterlogging can damage crops' });
      } else {
        farmingAdvice.push({ type: 'benefit', text: '✅ Halki barish fasal ke liye achhi hai — Koi chinta nahi', textEn: 'Light rain is beneficial for crops — No worries' });
      }
    } else if (rainStatus === 'rained_already') {
      farmingAdvice.push({ type: 'benefit', text: `✅ Aaj ${todayRain.pastPrecipitation}mm barish ho chuki — Mitti geeli hai, sinchai nahi chahiye`, textEn: `${todayRain.pastPrecipitation}mm rain already happened — Soil is wet, no irrigation needed` });
      farmingAdvice.push({ type: 'irrigation', text: '🌿 Kal subah mitti ki nami check karein', textEn: 'Check soil moisture tomorrow morning' });
    } else {
      farmingAdvice.push({ type: 'irrigation', text: '💧 Aaj sinchai karein — Barish ki koi sambhavna nahi', textEn: 'Irrigate today — No rain expected' });
    }
    if (nextRainIn && nextRainIn.days >= 1 && nextRainIn.days <= 3) {
      farmingAdvice.push({ type: 'plan', text: `📅 ${nextRainIn.days} din mein barish aayegi — Usse pehle spraying kar lein`, textEn: `Rain expected in ${nextRainIn.days} day(s) — Complete spraying before that` });
    }

    res.json({
      location: exactLocName,
      todayRain,
      nextRainIn,
      dailyForecast,
      hourlyToday,
      alertLevel,
      alertMessage,
      alertMessageHi,
      farmingAdvice,
      isMock: false,
      fetchedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Rain forecast error:', error.message);
    res.status(500).json({
      message: 'Could not fetch rain forecast',
      error: error.message,
    });
  }
};

module.exports = { getWeather, getRainForecast };
