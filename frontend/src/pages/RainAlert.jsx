import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';
import {
  FiCloud, FiDroplet, FiSearch, FiRefreshCw, FiAlertTriangle,
  FiCheckCircle, FiVolume2, FiVolumeX, FiClock, FiCalendar,
  FiArrowRight, FiShield,
} from 'react-icons/fi';

import { useAlarmSound } from '../hooks/useAlarmSound';

// ─── Circular Progress Ring ───
const CircularProgress = ({ percentage, size = 140, strokeWidth = 10, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        stroke={color} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
      />
    </svg>
  );
};

// ─── Alert Banner ───
const AlertBanner = ({ alertLevel, alertMessage, alertMessageHi, onPlayAlarm, isMuted, toggleMute }) => {
  const { t } = useLanguage();
  const config = {
    danger: {
      bg: 'bg-gradient-to-r from-red-600 to-red-500',
      icon: FiAlertTriangle,
      label: '🔴 DANGER ALERT',
      pulse: true,
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
      icon: FiAlertTriangle,
      label: '🟡 WARNING',
      pulse: false,
    },
    watch: {
      bg: 'bg-gradient-to-r from-sky-500 to-blue-500',
      icon: FiCloud,
      label: '🔵 WATCH',
      pulse: false,
    },
    none: {
      bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
      icon: FiCheckCircle,
      label: '🟢 ALL CLEAR',
      pulse: false,
    },
  };

  const c = config[alertLevel] || config.none;
  const Icon = c.icon;

  return (
    <div className={`${c.bg} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden ${c.pulse ? 'rain-alert-pulse' : ''}`}>
      {c.pulse && (
        <div className="absolute inset-0 bg-white/10 animate-ping rounded-2xl" style={{ animationDuration: '2s' }} />
      )}
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 ${c.pulse ? 'animate-bounce' : ''}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider opacity-90 mb-1">{c.label}</div>
            <p className="font-bold text-lg leading-snug">{t(alertMessageHi, alertMessage)}</p>
          </div>
        </div>
        <button
          onClick={toggleMute}
          id="rain-alert-mute-btn"
          className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
          title={isMuted ? 'Unmute alarm' : 'Mute alarm'}
        >
          {isMuted ? <FiVolumeX className="w-5 h-5" /> : <FiVolume2 className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

// ─── Hourly Bar ───
const HourlyBar = ({ hour, probability, isCurrentHour }) => {
  const height = Math.max(probability * 0.8, 4);
  let color = 'bg-gray-200';
  if (probability >= 70) color = 'bg-red-400';
  else if (probability >= 50) color = 'bg-amber-400';
  else if (probability >= 30) color = 'bg-sky-400';
  else if (probability > 0) color = 'bg-blue-200';

  return (
    <div className={`flex flex-col items-center gap-1 ${isCurrentHour ? 'scale-110' : ''}`} style={{ transition: 'transform 0.2s' }}>
      <span className="text-[10px] font-bold text-gray-500">{probability}%</span>
      <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
        <div
          className={`w-full max-w-[18px] rounded-t-md ${color} transition-all duration-700`}
          style={{ height: `${height}px` }}
        />
      </div>
      <span className={`text-[10px] font-medium ${isCurrentHour ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
        {hour}
      </span>
      {isCurrentHour && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
    </div>
  );
};

// ─── Main Page ───
const RainAlert = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [location, setLocation] = useState('');
  const { playAlarm, stopAlarm, toggleMute, isMuted, isPlaying } = useAlarmSound();
  const hasPlayedRef = useRef(false);

  const fetchRainData = useCallback(async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      const { data: d } = await api.get(`/weather/rain-forecast?location=${encodeURIComponent(loc)}`);
      setData(d);
      setLocation(loc);

      // Play alarm on danger/warning (first time only)
      if (!hasPlayedRef.current && (d.alertLevel === 'danger' || d.alertLevel === 'warning')) {
        hasPlayedRef.current = true;
        setTimeout(() => playAlarm(), 500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rain forecast fetch failed');
    } finally {
      setLoading(false);
    }
  }, [playAlarm]);

  useEffect(() => {
    const initLocation = async () => {
      try {
        const { data: farmsData } = await api.get('/farms');
        const defaultLoc = farmsData?.length > 0 ? farmsData[0].location : (user?.location || 'Dewas');
        setSearchInput(defaultLoc);
        fetchRainData(defaultLoc);
      } catch (e) {
        const defaultLoc = user?.location || 'Dewas';
        setSearchInput(defaultLoc);
        fetchRainData(defaultLoc);
      }
    };
    initLocation();
  }, [user?.location, fetchRainData]);

  // Auto-refresh every 10 mins
  useEffect(() => {
    if (!location) return;
    const interval = setInterval(() => {
      hasPlayedRef.current = false;
      fetchRainData(location);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location, fetchRainData]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      hasPlayedRef.current = false;
      fetchRainData(searchInput.trim());
    }
  };

  const currentHour = new Date().getHours();

  const getAlertColor = (level) => {
    if (level === 'danger') return '#ef4444';
    if (level === 'warning') return '#f59e0b';
    if (level === 'watch') return '#0ea5e9';
    return '#22c55e';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="page-title flex items-center gap-2">
                🌧️ {t("बारिश अलर्ट — Rain Alert", "Rain Alert")}
              </h1>
              <p className="page-subtitle">{t("रियल-टाइम बारिश भविष्यवाणी और किसानों के लिए अलर्ट सिस्टम।", "Real-time rain prediction and alert system for farmers.")}</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  id="rain-alert-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10"
                  placeholder={t("शहर या गाँव का नाम लिखें...", "Enter city or village name...")}
                />
              </div>
              <button type="submit" id="rain-alert-search-btn" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <div className="spinner w-4 h-4" /> : <FiSearch className="w-4 h-4" />}
                {t("खोजें", "Search")}
              </button>
              <button type="button" onClick={() => fetchRainData(location)} className="btn-secondary p-3" id="rain-alert-refresh-btn">
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </form>

            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="spinner w-12 h-12" />
                <p className="text-gray-500 mt-4 font-medium">{t("बारिश का डेटा लोड हो रहा है...", "Fetching rain data...")}</p>
              </div>
            )}

            {data && !loading && (
              <div className="space-y-6 animate-fade-in">
                {/* Alert Banner */}
                <AlertBanner
                  alertLevel={data.alertLevel}
                  alertMessage={data.alertMessage}
                  alertMessageHi={data.alertMessageHi}
                  onPlayAlarm={playAlarm}
                  isMuted={isMuted}
                  toggleMute={toggleMute}
                />

                {/* Top Row: Today's Rain + Next Rain Countdown */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Today's Rain Status */}
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <FiDroplet className="w-5 h-5 text-blue-500" />
                      <h3 className="font-display font-bold text-gray-900">{t("आज की बारिश", "Today's Rain")}</h3>
                      <span className="text-xs text-gray-400 ml-auto">{data.location}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0">
                        <CircularProgress
                          percentage={data.todayRain.probability}
                          color={getAlertColor(data.alertLevel)}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-display font-extrabold text-gray-900">{data.todayRain.probability}%</span>
                          <span className="text-xs text-gray-500">{t("आज का max", "today max")}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        {/* Status Badge */}
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                          data.todayRain.rainStatus === 'coming_soon'
                            ? 'bg-blue-100 text-blue-700'
                            : data.todayRain.rainStatus === 'rained_already'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-green-100 text-green-700'
                        }`}>
                          {data.todayRain.rainStatus === 'coming_soon' && t('🌧️ बारिश अभी आएगी', '🌧️ Rain Coming Soon')}
                          {data.todayRain.rainStatus === 'rained_already' && t('✅ बारिश हो चुकी', '✅ Rained Already')}
                          {data.todayRain.rainStatus === 'not_expected' && t('☀️ बारिश नहीं होगी', '☀️ No Rain Expected')}
                        </div>

                        {/* Details based on status */}
                        {data.todayRain.rainStatus === 'coming_soon' && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <FiClock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{t("Expected:", "Expected:")} <strong className="text-gray-900">{data.todayRain.expectedTime}</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FiDroplet className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{t("बाकी घंटों में:", "In remaining hours:")} <strong className="text-blue-600">{data.todayRain.remainingProbability}% {t("chance", "chance")}</strong></span>
                            </div>
                          </>
                        )}
                        {data.todayRain.rainStatus === 'rained_already' && (
                          <>
                            <div className="flex items-center gap-2 text-sm">
                              <FiDroplet className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-600">{t("हो चुकी:", "Rained:")} <strong className="text-amber-700">{data.todayRain.pastPrecipitation}mm</strong></span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FiClock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{t("समय:", "Time:")} <strong className="text-gray-900">{data.todayRain.expectedTime}</strong></span>
                            </div>
                            <div className="text-xs text-green-600 font-medium">{t("अब और बारिश नहीं होगी ✓", "No more rain today ✓")}</div>
                          </>
                        )}
                        {data.todayRain.rainStatus === 'not_expected' && (
                          <div className="text-sm text-gray-500">{t("आज पूरे दिन बारिश की कोई संभावना नहीं है।", "No rain expected for the rest of the day.")}</div>
                        )}

                        {/* Total precip */}
                        {data.todayRain.totalPrecipitation > 0 && (
                          <div className="text-xs text-gray-400">
                            {t("कुल:", "Total:")} {data.todayRain.totalPrecipitation} mm ({data.todayRain.intensity === 'none' ? t('नगण्य', 'negligible') : data.todayRain.intensity})
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Next Rain Countdown */}
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <FiCalendar className="w-5 h-5 text-purple-500" />
                      <h3 className="font-display font-bold text-gray-900">{t("अगली बारिश कब?", "Next Rain When?")}</h3>
                    </div>
                    {data.nextRainIn ? (
                      <div className="text-center py-4">
                        <div className="relative inline-block">
                          <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center mx-auto ${
                            data.nextRainIn.days === 0
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 rain-alert-pulse'
                              : data.nextRainIn.days === 1
                                ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                                : data.nextRainIn.days <= 3
                                  ? 'bg-gradient-to-br from-sky-400 to-cyan-500'
                                  : 'bg-gradient-to-br from-sky-400 to-blue-500'
                          } text-white shadow-lg`}>
                            <span className="text-3xl font-display font-extrabold">
                              {data.nextRainIn.days === 0 ? t('आज', 'Today') : data.nextRainIn.days === 1 ? t('कल', 'Tmrw') : data.nextRainIn.days}
                            </span>
                            {data.nextRainIn.days > 1 && (
                              <span className="text-xs font-medium opacity-90">{t("दिन में", "Days")}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mt-4">
                          {data.nextRainIn.days === 0
                            ? t('🌧️ आज बारिश आएगी!', '🌧️ Rain Today!')
                            : data.nextRainIn.days === 1
                              ? t('🌧️ कल बारिश आएगी!', '🌧️ Rain Tomorrow!')
                              : t(`🌧️ ${data.nextRainIn.days} दिन में बारिश`, `🌧️ Rain in ${data.nextRainIn.days} Days`)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {t(data.nextRainIn.dayHi, data.nextRainIn.date)}, {data.nextRainIn.date} — {data.nextRainIn.probability}% {t("chance", "chance")}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <span className="text-3xl">☀️</span>
                        </div>
                        <p className="font-bold text-gray-900">{t("अगले 7 दिन बारिश नहीं", "No rain in next 7 days")}</p>
                        <p className="text-sm text-gray-500 mt-1">{t("आने वाले हफ्ते में कोई बारिश की संभावना नहीं है", "No rain expected in the coming week")}</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Hourly Rain Chart */}
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-5 h-5 text-sky-500" />
                      <h3 className="font-display font-bold text-gray-900">{t("आज का Hourly बारिश चार्ट", "Today's Hourly Rain Chart")}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" />70%+</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />50%+</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />30%+</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1.5 min-w-[600px] pb-2" style={{ minWidth: 'max-content' }}>
                      {data.hourlyToday.map((h) => (
                        <HourlyBar
                          key={h.hour}
                          hour={h.time}
                          probability={h.probability}
                          isCurrentHour={h.hour === currentHour}
                        />
                      ))}
                    </div>
                  </div>
                </Card>

                {/* 7-Day Forecast */}
                <Card>
                  <div className="flex items-center gap-2 mb-5">
                    <FiCalendar className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-display font-bold text-gray-900">{t("7-दिन का बारिश पूर्वानुमान", "7-Day Rain Forecast")}</h3>
                  </div>
                  <div className="space-y-3">
                    {data.dailyForecast.map((day, i) => (
                      <div
                        key={day.date}
                        className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${
                          day.isRainDay
                            ? 'bg-blue-50 border border-blue-100'
                            : 'bg-gray-50'
                        } ${i === 0 ? 'ring-2 ring-green-200' : ''}`}
                      >
                        <div className="w-16 flex-shrink-0">
                          <div className="text-sm font-bold text-gray-900">
                            {i === 0 ? t('आज', 'Today') : i === 1 ? t('कल', 'Tmrw') : t(day.dayHi.slice(0, 3), day.dateFormatted.split(' ')[0])}
                          </div>
                          <div className="text-xs text-gray-400">{day.dateFormatted}</div>
                        </div>
                        <div className="text-xl flex-shrink-0">
                          {day.isRainDay ? '🌧️' : day.description === 'Partly cloudy' ? '⛅' : '☀️'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  day.rainProbability >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                  day.rainProbability >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                  'bg-gradient-to-r from-gray-300 to-gray-400'
                                }`}
                                style={{ width: `${day.rainProbability}%` }}
                              />
                            </div>
                            <span className={`text-sm font-bold min-w-[40px] text-right ${
                              day.rainProbability >= 70 ? 'text-blue-600' :
                              day.rainProbability >= 40 ? 'text-amber-600' : 'text-gray-400'
                            }`}>
                              {day.rainProbability}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{day.description}</span>
                            <span>🌡️ {day.tempMax}°/{day.tempMin}°</span>
                            {day.rainAmount > 0 && <span>💧 {day.rainAmount}mm</span>}
                          </div>
                        </div>
                        {day.isRainDay && (
                          <span className="badge-blue text-[10px] flex-shrink-0">{t("बारिश", "RAIN")}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Farming Advice */}
                <Card>
                  <div className="flex items-center gap-2 mb-4">
                    <FiShield className="w-5 h-5 text-green-500" />
                    <h3 className="font-display font-bold text-gray-900">{t("किसान एडवाइजरी — Farming Advice", "Farming Advisory")}</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {data.farmingAdvice.map((adv, i) => (
                      <div
                        key={i}
                        className={`p-4 rounded-xl border ${
                          adv.type === 'irrigation' ? 'bg-blue-50 border-blue-100' :
                          adv.type === 'harvest' ? 'bg-amber-50 border-amber-100' :
                          adv.type === 'protection' ? 'bg-red-50 border-red-100' :
                          adv.type === 'benefit' ? 'bg-green-50 border-green-100' :
                          'bg-purple-50 border-purple-100'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-800 leading-relaxed">{t(adv.text, adv.textEn || adv.text)}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Footer link */}
                <div className="text-center text-xs text-gray-400 py-4">
                  Data powered by Open-Meteo • {t("हर 10 मिनट में ऑटो-रिफ्रेश", "Auto-refreshes every 10 minutes")}
                  <br />
                  {t("अंतिम अपडेट:", "Last updated:")} {new Date(data.fetchedAt).toLocaleTimeString(t('hi-IN', 'en-IN'), { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        .rain-alert-pulse {
          animation: rainPulse 2s ease-in-out infinite;
        }
        @keyframes rainPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default RainAlert;
