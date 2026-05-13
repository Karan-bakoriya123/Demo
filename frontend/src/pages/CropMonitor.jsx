import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import { FiDroplet, FiCloud, FiThermometer, FiAlertTriangle, FiRefreshCw, FiBell, FiX, FiArrowRight, FiActivity, FiCalendar, FiWind } from "react-icons/fi";
import { GiWheat, GiPlantRoots } from "react-icons/gi";
import { useAlarmSound } from '../hooks/useAlarmSound';

const SeverityColors = {
  critical: { border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700' },
  high:     { border: 'border-orange-200', bg: 'bg-orange-50', text: 'text-orange-700' },
  medium:   { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  none:     { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-700' },
};

const alertBgMap = {
  danger:  'from-red-600 to-red-500',
  warning: 'from-amber-500 to-yellow-400',
  watch:   'from-sky-500 to-blue-400',
  none:    'from-emerald-500 to-green-400',
};

const WaterColors = {
  critical:   { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
  high:       { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-500' },
  none:       { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
  low:        { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
  irrigating: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-500' },
};

const TempColors = {
  danger:  { icon: 'text-red-500', text: 'text-red-600', border: '#ef4444', bg: '#fef2f2' },
  warning: { icon: 'text-amber-500', text: 'text-amber-600', border: '#f59e0b', bg: '#fffbeb' },
  optimal: { icon: 'text-green-500', text: 'text-green-600', border: '#22c55e', bg: '#f0fdf4' },
};

const CropMonitor = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [alertPopup, setAlertPopup] = useState(null);
  const [alertShown, setAlertShown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playAlarm, stopAlarm } = useAlarmSound();
  const intervalRef = useRef(null);

  const fetchData = useCallback(async (farmId, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const url = farmId ? `/crop-monitor?farmId=${farmId}` : "/crop-monitor";
      const res = await api.get(url);
      setData(res.data);
      const criticalDecision = res.data.decisions?.find(d => d.severity === "critical" && d.sound);
      if (criticalDecision && !alertShown) {
        setAlertPopup(criticalDecision);
        setAlertShown(true);
        if (soundEnabled) playAlarm();
        toast.error(t(criticalDecision.titleHi, criticalDecision.titleEn), { duration: 6000 });
      }
    } catch {
      if (!silent) toast.error(t("डेटा लोड नहीं हो सका।", "Failed to load data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [alertShown, soundEnabled]);

  useEffect(() => {
    fetchData(selectedFarmId);
    // Real-time: refresh every 30 seconds when IoT is active
    intervalRef.current = setInterval(() => fetchData(selectedFarmId, true), 30 * 1000);
    return () => clearInterval(intervalRef.current);
  }, [selectedFarmId, fetchData]);

  const triggerTestAlarm = () => {
    const testDecision = {
      priority: 1, type: 'alert', severity: 'critical',
      icon: '⛈️', titleHi: 'टेस्ट अलर्ट: भारी बारिश आने वाली है!', titleEn: 'Test: Heavy Rain Incoming!',
      messageHi: 'यह एक डेमो अलर्ट है। सिस्टम बिल्कुल सही काम कर रहा है!', messageEn: 'This is a test alarm.',
      action: 'rain_alert', sound: true,
    };
    setAlertPopup(testDecision);
    setAlertShown(true);
    if (soundEnabled) playAlarm();
    toast.error(t(testDecision.titleHi, testDecision.titleEn), { duration: 6000 });
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-14 h-14" />
          <p className="text-green-700 font-semibold text-lg">{t("🌱 फसल डेटा लोड हो रहा है...", "🌱 Loading crop data...")}</p>
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100"><Sidebar /></aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="card text-center py-20">
            <GiWheat className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">{t("कोई खेत नहीं मिला", "No farm found")}</h2>
            <p className="text-gray-500 mb-6">{t("पहले एक खेत जोड़ें फिर यहाँ मॉनिटरिंग देखें।", "Add a farm first to see monitoring here.")}</p>
            <Link to="/add-farm" className="btn-primary">{t("+ खेत जोड़ें", "+ Add Farm")}</Link>
          </div>
        </main>
      </div>
    </div>
  );

  const { farm, allFarms, health, growth, water, pesticide, temperature, harvest, weather, rainAlert, soil, decisions } = data;
  const wc = WaterColors[water?.urgency] || WaterColors.low;
  const tc = TempColors[temperature?.status] || TempColors.optimal;
  const alertBg = alertBgMap[rainAlert?.alertLevel] || alertBgMap.none;
  const healthColor = health.score >= 80 ? "#22c55e" : health.score >= 60 ? "#84cc16" : health.score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {alertPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
            <div className="text-6xl text-center mb-4">{alertPopup.icon}</div>
            <h2 className="text-2xl font-bold text-center text-red-600 mb-3">{t(alertPopup.titleHi, alertPopup.titleEn)}</h2>
            <p className="text-center text-gray-600 mb-2">{t(alertPopup.messageHi, alertPopup.messageEn)}</p>
            <button 
              onClick={() => {
                setAlertPopup(null);
                stopAlarm();
              }} 
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <FiX /> {t("समझ गया (OK)", "Understood (OK)")}
            </button>
          </div>
        </div>
      )}

      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-4 md:p-6 space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title flex items-center gap-2">
                <GiWheat className="text-green-500" /> {t("फसल मॉनिटरिंग Dashboard", "Crop Monitoring Dashboard")}
              </h1>
              <p className="page-subtitle">
                {t("रियल-टाइम फसल स्वास्थ्य", "Real-time Crop Health")} — {t(farm.cropNameHi || farm.cropType, farm.cropType)} {farm.cropEmoji} • {farm.farmName}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-gray-500 font-medium">Farm ID: <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-mono border border-gray-200">{farm._id}</span></span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(farm._id); toast.success(t('Farm ID कॉपी हो गया!', 'Farm ID Copied!')); }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-bold"
                >
                  {t("कॉपी करें", "Copy")}
                </button>
                {data?.iot?.active && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded-full animate-pulse">
                    🛰️ Live IoT
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={triggerTestAlarm}
                className="btn-secondary text-sm flex items-center gap-2 text-blue-600 bg-blue-50 border-blue-200"
                title="अलार्म टेस्ट करें"
              >
                <FiAlertTriangle className="w-4 h-4" />
                {t("टेस्ट अलार्म", "Test Alarm")}
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`btn-secondary text-sm flex items-center gap-2 ${soundEnabled ? 'text-green-600 bg-green-50 border-green-200' : 'text-gray-400'}`}
                title={t("बारिश का अलार्म (Rain Alarm)", "Rain Alarm")}
              >
                {soundEnabled ? <FiBell className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                {t("अलार्म", "Alarm")} {soundEnabled ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => { setAlertShown(false); fetchData(selectedFarmId); }}
                disabled={refreshing}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} /> {t("रिफ्रेश", "Refresh")}
              </button>
            </div>
          </div>

          {allFarms?.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {allFarms.map(f => {
                const isActive = selectedFarmId === f._id || (!selectedFarmId && f._id === farm._id);
                return (
                  <button
                    key={f._id}
                    onClick={() => { setSelectedFarmId(f._id); setAlertShown(false); }}
                    className={isActive
                      ? "px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white shadow"
                      : "px-4 py-2 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-green-300"
                    }
                  >
                    {f.cropEmoji || "🌱"} {f.farmName}
                  </button>
                );
              })}
            </div>
          )}

          {rainAlert && rainAlert.alertLevel !== "none" && (
            <div className={[
              "flex items-center gap-3 px-5 py-4 rounded-2xl text-white shadow-lg",
              "bg-gradient-to-r",
              alertBg,
              rainAlert.alertLevel === "danger" ? "animate-pulse" : ""
            ].join(" ")}>
              <span className="text-3xl">
                {rainAlert.alertLevel === "danger" ? "⛈️" : rainAlert.alertLevel === "warning" ? "🌧️" : "🌦️"}
              </span>
              <div className="flex-1">
                <p className="font-bold">{t(rainAlert.alertMessageHi, rainAlert.alertMessage)}</p>
              </div>
              <Link to="/rain-alert" className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                {t("विवरण", "Details")} <FiArrowRight />
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card relative overflow-hidden">
              <div
                className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10"
                style={{ backgroundColor: healthColor, transform: 'translate(30%, -30%)' }}
              />
              <FiActivity className="w-6 h-6" style={{ color: healthColor }} />
              <div className="stat-number" style={{ color: healthColor }}>
                {health.score}<span className="text-lg">/100</span>
              </div>
              <div className="stat-label">{t("स्वास्थ्य स्कोर", "Health Score")}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: healthColor }}>
                {t(health.statusHi, health.statusEn || health.statusHi)}
              </div>
            </div>

            <div className="stat-card">
              <FiCalendar className="w-6 h-6 text-amber-500" />
              <div className="stat-number text-3xl text-amber-600">
                {harvest.isHarvested ? "✓" : harvest.daysRemaining}
              </div>
              <div className="stat-label">{harvest.isHarvested ? t("कटाई हो गई", "Harvested") : t("दिन बाकी", "Days Left")}</div>
              <div className="text-xs text-gray-400 mt-1">
                {harvest.isHarvested ? t("Harvested", "Harvested") : `${growth.progress}% ${t("पूरा", "Done")}`}
              </div>
            </div>

            <div className="stat-card">
              <FiDroplet className={['w-6 h-6', wc.icon].join(' ')} />
              <div className={['stat-number text-2xl', wc.text].join(' ')}>{t(
                water.status === 'Irrigating' ? 'सिंचाई हो रही है' :
                water.status === 'Not Required' ? 'जरूरत नहीं' :
                water.status === 'Required' ? 'जरूरी है' :
                water.status === 'Critical' ? 'तत्काल करें' : water.status,
                water.status
              )}</div>
              <div className="stat-label">{t("सिंचाई स्थिति", "Irrigation Status")}</div>
              <div className="text-xs text-gray-400 mt-1">{t("नमी", "Moisture")}: {soil.moisture}%</div>
            </div>

            {/* Motor / Pump Status Card (IoT) - Smart States */}
            {(() => {
              const iot = data?.iot;
              const motorOn = iot?.motorOn;
              const isActive = iot?.active;
              const isRecent = iot?.recent;
              const lastIrrAt = iot?.lastIrrigatedAt;
              
              // Time since last irrigation
              const minsAgo = lastIrrAt 
                ? Math.floor((Date.now() - new Date(lastIrrAt)) / 60000)
                : null;
              const timeLabel = minsAgo !== null
                ? (minsAgo < 1 ? t('अभी', 'just now') 
                  : minsAgo < 60 ? `${minsAgo} ${t('मिनट पहले', 'min ago')}` 
                  : `${Math.floor(minsAgo/60)} ${t('घंटे पहले', 'hr ago')}`)
                : null;

              // Determine card state
              let cardClass = 'stat-card border-2 ';
              let icon = '⛽';
              let labelColor = 'text-gray-400';
              let label = t('IoT बंद', 'No IoT');
              let subText = t('हार्डवेयर ऑफलाइन', 'Hardware offline');

              if (motorOn && isActive) {
                // PUMP IS ON - Irrigating NOW
                cardClass += 'border-cyan-400 bg-cyan-50';
                icon = '🚰';
                labelColor = 'text-cyan-600';
                label = t('🚰 पंप चालू!', '🚰 Pump ON!');
                subText = `🛰️ ${t('सिंचाई हो रही है', 'Irrigating')} • ${soil.moisture}%`;
              } else if (!motorOn && isActive && lastIrrAt && minsAgo < 120) {
                // PUMP JUST TURNED OFF - Recently irrigated
                cardClass += 'border-green-300 bg-green-50';
                icon = '✅';
                labelColor = 'text-green-600';
                label = t('सिंचाई पूरी!', 'Irrigated!');
                subText = `${t('पूरी हुई', 'Done')} ${timeLabel}`;
              } else if (!motorOn && (isActive || isRecent)) {
                // PUMP OFF - Waiting
                cardClass += 'border-gray-200';
                icon = '💤';
                labelColor = 'text-gray-500';
                label = t('पंप बंद', 'Pump OFF');
                subText = `🛰️ ${t('लाइव', 'Live')} • ${soil.moisture}% ${t('नमी', 'moisture')}`;
              } else if (lastIrrAt) {
                // No live IoT but has history
                cardClass += 'border-gray-100';
                icon = '🕐';
                labelColor = 'text-gray-400';
                label = t('अंतिम सिंचाई', 'Last Irrigation');
                subText = timeLabel || '-';
              } else {
                cardClass += 'border-gray-100';
              }

              return (
                <div className={cardClass}>
                  <div className="text-2xl">{icon}</div>
                  <div className={`stat-number text-xl font-bold ${labelColor}`}>{label}</div>
                  <div className="stat-label">{t("पंप स्थिति", "Pump Status")}</div>
                  <div className="text-xs text-gray-400 mt-1">{subText}</div>
                </div>
              );
            })()}
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiActivity className="text-green-600" /> {t("फसल विकास (Growth Timeline)", "Crop Growth Timeline")}
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">
                    {t(growth.currentStage?.nameHi || growth.currentStage?.name, growth.currentStage?.name)}
                  </span>
                  <span className="text-gray-500">
                    {growth.daysElapsed} / {growth.totalDays} {t("दिन", "days")}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-4 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"
                    style={{ width: `${growth.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{t("बुवाई", "Sowing")}</span>
                  <span>{growth.progress}%</span>
                  <span>{t("कटाई", "Harvest")}</span>
                </div>
              </div>

              <div className="flex gap-1 flex-wrap mt-6">
                {growth.stages?.map((stage, i) => {
                  const isActive = i === growth.currentStageIndex;
                  const isDone = i < growth.currentStageIndex;
                  return (
                    <div
                      key={i}
                      className={[
                        "flex-1 min-w-[60px] rounded-xl p-2 text-center text-xs border transition-all",
                        isActive ? "bg-green-50 border-green-300 shadow-sm" : isDone ? "bg-gray-50 border-gray-200 text-gray-400" : "bg-white border-gray-100 text-gray-300"
                      ].join(" ")}
                    >
                      <div className="text-base mb-0.5">{stage.emoji || "🌱"}</div>
                      <div className="font-medium truncate">{t(stage.nameHi || stage.name, stage.name)}</div>
                      <div className="text-gray-400">{stage.startDay}-{stage.endDay}d</div>
                    </div>
                  );
                })}
              </div>

              {!harvest.isHarvested && (
                <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-3xl">🌾</span>
                  <div>
                    <p className="font-semibold text-amber-800">{t("संभावित कटाई की तारीख", "Estimated Harvest Date")}</p>
                    <p className="text-amber-600 text-sm">
                      {new Date(harvest.estimatedDate).toLocaleDateString(t("hi-IN", "en-US"), { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-3xl font-bold text-amber-700">{harvest.daysRemaining}</p>
                    <p className="text-xs text-amber-500 uppercase font-bold tracking-wider">{t("दिन बाकी", "Days Left")}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiThermometer className="text-orange-500" /> {t("मौसम", "Weather")}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FiThermometer className="text-orange-500" />
                    <span className="text-sm text-gray-600">{t("तापमान", "Temp")}</span>
                  </div>
                  <span className="font-bold text-orange-700">{weather.temperature}°C</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FiDroplet className="text-blue-500" />
                    <span className="text-sm text-gray-600">{t("नमी", "Humidity")}</span>
                  </div>
                  <span className="font-bold text-blue-700">{weather.humidity}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-sky-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FiCloud className="text-sky-500" />
                    <span className="text-sm text-gray-600">{t("बारिश", "Rain")}</span>
                  </div>
                  <span className="font-bold text-sky-700">{weather.rainChance}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FiWind className="text-gray-500" />
                    <span className="text-sm text-gray-600">{t("हवा", "Wind")}</span>
                  </div>
                  <span className="font-bold text-gray-700">{weather.windSpeed} km/h</span>
                </div>
              </div>
              <div
                className="mt-3 p-3 rounded-xl border text-xs text-center"
                style={{ borderColor: tc.border, backgroundColor: tc.bg }}
              >
                <p className="font-medium" style={{ color: tc.border }}>{t(temperature.messageHi, temperature.messageEn)}</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiDroplet className="text-blue-500" /> {t("सिंचाई", "Irrigation")}
              </h3>
              <div className={['text-center py-4 rounded-xl mb-3', wc.bg].join(' ')}>
                <div className="text-4xl mb-1">
                  {water.urgency === "critical" ? "🚨" : water.urgency === "high" ? "💧" : water.urgency === "none" ? "✅" : "💦"}
                </div>
                <p className={['font-bold text-lg', wc.text].join(' ')}>{water.status}</p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{t(water.messageHi, water.messageEn || water.messageHi)}</p>
              {water.litersPerAcre > 0 && (
                <div className="mt-3 bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{water.litersPerAcre}</p>
                  <p className="text-xs text-blue-500">{t("लीटर / एकड़ चाहिए", "Liters / Acre Needed")}</p>
                </div>
              )}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{t("मिट्टी नमी", "Soil Moisture")}</span>
                  <span>{soil.moisture}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, soil.moisture)}%`,
                      backgroundColor: soil.moisture < 25 ? "#ef4444" : soil.moisture < 40 ? "#f97316" : "#22c55e"
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span>
                  <span>{t("इष्टतम", "Optimal")}: {water.optimalRange?.min}-{water.optimalRange?.max}%</span>
                  <span>100%</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-sm bg-blue-50/50 px-3 py-2 rounded-lg">
                  <span className="font-medium text-gray-700">💧 {t("अगली सिंचाई (अनुमानित):", "Next Irrigation (Est):")}</span>
                  <span className="font-bold text-blue-700">
                    {water.nextIrrigationDays > 0 ? `${water.nextIrrigationDays} ${t("दिन बाद", "days later")}` : t('आज ही', 'Today')}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <GiPlantRoots className="text-purple-500" /> {t("कीटनाशक शेड्यूल", "Pesticide Schedule")}
              </h3>
              <div
                className={[
                  'text-center py-4 rounded-xl mb-3',
                  pesticide.urgency === "critical" ? "bg-red-50" : pesticide.urgency === "high" ? "bg-orange-50" : "bg-green-50"
                ].join(' ')}
              >
                <div className="text-4xl mb-1">
                  {pesticide.urgency === "critical" ? "🚨" : pesticide.urgency === "high" ? "⚠️" : "✅"}
                </div>
                <p
                  className={[
                    'font-bold',
                    pesticide.urgency === "critical" ? "text-red-600" : pesticide.urgency === "high" ? "text-orange-600" : "text-green-600"
                  ].join(' ')}
                >
                  {pesticide.needed ? t("जरूरी है", "Needed") : t("अभी नहीं", "Not Needed")}
                </p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{t(pesticide.messageHi, pesticide.messageEn || pesticide.messageHi)}</p>
              <div className="space-y-2">
                {pesticide.upcoming?.slice(0, 3).map((s, i) => (
                  <div
                    key={i}
                    className={[
                      "flex items-center justify-between p-2 rounded-lg text-xs",
                      s.daysUntil <= 7 ? "bg-orange-50 border border-orange-100" : "bg-gray-50"
                    ].join(" ")}
                  >
                    <span className="font-medium">{t(s.nameHi || s.type, s.type)}</span>
                    <span className={s.daysUntil <= 7 ? "text-orange-600 font-bold" : "text-gray-500"}>
                      {s.daysUntil} {t("दिन", "days")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDroplet className="text-teal-500" /> {t("मिट्टी NPK", "Soil NPK")}
              </h3>
              {[
                { label: t("नाइट्रोजन (N)", "Nitrogen (N)"), val: soil.nitrogen, max: 80, color: "#22c55e" },
                { label: t("फास्फोरस (P)", "Phosphorus (P)"), val: soil.phosphorus, max: 50, color: "#3b82f6" },
                { label: t("पोटेशियम (K)", "Potassium (K)"), val: soil.potassium, max: 50, color: "#f59e0b" },
                { label: "pH", val: soil.pH, max: 14, color: "#8b5cf6" }
              ].map(({ label, val, max, color }) => (
                <div key={label} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-bold" style={{ color }}>{val}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (val / max) * 100)}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              ))}
              {!soil.hasData && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-4">
                  ⚠️ {t("डिफ़ॉल्ट मूल्य।", "Default Values.")} <Link to="/soil-input" className="underline font-medium">{t("असली डेटा डालें", "Enter Real Data")}</Link>
                </p>
              )}
            </div>
          </div>

          <div className="card mb-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-amber-500" /> {t("निर्णय केंद्र (Decision Center)", "Decision Center")}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {decisions.map((dec, i) => {
                const sevColors = SeverityColors[dec.severity] || SeverityColors.none;
                return (
                  <div key={i} className={['border rounded-2xl p-4', sevColors.border, sevColors.bg].join(' ')}>
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{dec.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={['font-bold text-sm', sevColors.text].join(' ')}>{t(dec.titleHi, dec.titleEn || dec.titleHi)}</p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{t(dec.messageHi, dec.messageEn || dec.messageHi)}</p>
                        {dec.severity === "critical" && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-full font-bold uppercase tracking-wider animate-pulse">
                            🚨 {t("तुरंत कार्रवाई करें", "Take Action Immediately")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {rainAlert?.forecast7Day && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiCloud className="text-sky-500" /> {t("7-दिन मौसम पूर्वानुमान", "7-Day Weather Forecast")}
              </h3>
              <div className="grid grid-cols-7 gap-2 overflow-x-auto pb-2">
                {rainAlert.forecast7Day.map((day, i) => (
                  <div
                    key={i}
                    className={[
                      "text-center p-2 rounded-xl border text-xs min-w-[70px]",
                      day.isRainDay ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"
                    ].join(" ")}
                  >
                    <p className="font-bold text-gray-700 mb-1">{t(day.dayHi || day.day, day.day)}</p>
                    <div className="text-xl mb-1">
                      {day.rainProbability >= 60 ? "🌧️" : day.rainProbability >= 35 ? "🌦️" : "☀️"}
                    </div>
                    <p className={["font-semibold", day.isRainDay ? "text-blue-600" : "text-gray-500"].join(" ")}>
                      {day.rainProbability}%
                    </p>
                    <p className="text-gray-500 mt-1">{day.tempMax}°/{day.tempMin}°</p>
                    {day.rainAmount > 0 && <p className="text-blue-500 mt-0.5">{day.rainAmount}mm</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            {t("अंतिम अपडेट:", "Last Updated:")} {data.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString(t("hi-IN", "en-US")) : t("अभी", "Just now")} • {t("हर 5 मिनट में रिफ्रेश होता है", "Refreshes every 5 mins")}
          </p>

        </main>
      </div>
    </div>
  );
};

export default CropMonitor;
