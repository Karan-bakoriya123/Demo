import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiDroplet, FiCloud, FiMessageCircle, FiPlus, FiArrowRight,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiRefreshCw,
  FiThermometer, FiWind, FiActivity, FiClock
} from 'react-icons/fi';
import { GiPlantRoots, GiWheat } from 'react-icons/gi';

const StatusBadge = ({ status }) => {
  if (status === 'Good') return <span className="badge-green">● Good</span>;
  if (status === 'Moderate') return <span className="badge-yellow">● Moderate</span>;
  return <span className="badge-red">● Poor</span>;
};

const IrrigationBadge = ({ status }) => {
  if (status === 'Required') return <span className="badge-red flex items-center gap-1"><FiDroplet className="w-3 h-3" /> Required</span>;
  if (status === 'Not Required') return <span className="badge-green flex items-center gap-1"><FiCheckCircle className="w-3 h-3" /> Not Required</span>;
  return <span className="badge-yellow flex items-center gap-1"><FiAlertTriangle className="w-3 h-3" /> Optional</span>;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [latestRec, setLatestRec] = useState(null);
  const [weather, setWeather] = useState(null);
  const [rainAlert, setRainAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activities, setActivities] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [farmsRes, recRes] = await Promise.allSettled([
        api.get('/farms'),
        api.get('/recommendations/latest'),
      ]);

      if (farmsRes.status === 'fulfilled') {
        setFarms(farmsRes.value.data);
        if (farmsRes.value.data.length > 0) setSelectedFarm(farmsRes.value.data[0]);
      }
      if (recRes.status === 'fulfilled') {
        setLatestRec(recRes.value.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async (location) => {
    if (!location) return;
    setWeatherLoading(true);
    try {
      const { data } = await api.get(`/weather?location=${encodeURIComponent(location)}`);
      setWeather(data);
    } catch (err) {
      toast.error('Could not fetch weather data');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const location = selectedFarm?.location || user?.location;
    if (location) {
      fetchWeather(location);
      // Fetch rain alert
      api.get(`/weather/rain-forecast?location=${encodeURIComponent(location)}`)
        .then(res => setRainAlert(res.data))
        .catch(() => {});
    }
    if (selectedFarm) {
      api.get(`/farms/${selectedFarm._id}/activities`)
        .then(res => setActivities(res.data))
        .catch(() => {});
    }
  }, [selectedFarm, user?.location, fetchWeather]);

  const logActivity = async (type) => {
    if (!selectedFarm) return;
    try {
      const { data } = await api.post(`/farms/${selectedFarm._id}/activities`, { activityType: type, notes: 'Logged from dashboard' });
      toast.success(`Marked as ${type} successfully!`);
      setActivities([data.activity, ...activities]);
      fetchData(); // Refresh recommendation
    } catch (err) {
      toast.error('Failed to log activity');
    }
  };

  // Auto-refresh rain alert every 10 mins
  useEffect(() => {
    const location = selectedFarm?.location || user?.location;
    if (!location) return;
    const interval = setInterval(() => {
      api.get(`/weather/rain-forecast?location=${encodeURIComponent(location)}`)
        .then(res => setRainAlert(res.data))
        .catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedFarm, user?.location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="spinner w-12 h-12" />
            <p className="text-gray-500 font-medium">Loading your farm data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>

        <main className="flex-1 lg:ml-64 p-6">
          {(() => {
            const lastIrrigation = activities.find(a => a.activityType === 'Irrigation');
            const lastPesticide = activities.find(a => a.activityType === 'Pesticide');
            return (
              <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="page-subtitle">Here's your farm status for today.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchData}
                className="btn-secondary flex items-center gap-2 text-sm"
                id="dashboard-refresh-btn"
              >
                <FiRefreshCw className="w-4 h-4" /> Refresh
              </button>
              <Link to="/add-farm" id="dashboard-add-farm-btn" className="btn-primary flex items-center gap-2 text-sm">
                <FiPlus className="w-4 h-4" /> Add Farm
              </Link>
            </div>
          </div>

            {/* Rain Alert Mini Banner */}
            {rainAlert && (
              <Link
                to="/rain-alert"
                id="dashboard-rain-alert-banner"
                className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 ${
                  rainAlert.alertLevel === 'danger' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                  rainAlert.alertLevel === 'warning' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                  rainAlert.alertLevel === 'watch' ? 'bg-gradient-to-r from-sky-500 to-blue-500' :
                  'bg-gradient-to-r from-emerald-500 to-green-500'
                } ${rainAlert.alertLevel === 'danger' ? 'animate-pulse' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  {rainAlert.alertLevel === 'danger' || rainAlert.alertLevel === 'warning' ? (
                    <FiAlertTriangle className="w-5 h-5" />
                  ) : rainAlert.alertLevel === 'watch' ? (
                    <FiCloud className="w-5 h-5" />
                  ) : (
                    <FiCheckCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{rainAlert.alertMessageHi}</p>
                  <p className="text-xs opacity-80 truncate">{rainAlert.alertMessage}</p>
                </div>
                <FiArrowRight className="w-5 h-5 flex-shrink-0 opacity-70" />
              </Link>
            )}

          {/* No farms state */}
          {farms.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <GiWheat className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="font-display font-bold text-gray-900 text-xl mb-2">No farms yet</h2>
              <p className="text-gray-500 mb-6">Add your first farm to start getting AI recommendations.</p>
              <Link to="/add-farm" id="dashboard-first-farm-btn" className="btn-primary inline-flex items-center gap-2">
                <FiPlus className="w-4 h-4" /> Add Your First Farm
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Farm selector */}
              {farms.length > 1 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-600">Viewing:</span>
                  {farms.map((f) => (
                    <button
                      key={f._id}
                      onClick={() => setSelectedFarm(f)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedFarm?._id === f._id
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                      }`}
                    >
                      {f.farmName}
                    </button>
                  ))}
                </div>
              )}

              {/* Summary stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                  <GiWheat className="w-6 h-6 text-green-500" />
                  <div className="stat-number text-2xl">{selectedFarm?.cropType || '—'}</div>
                  <div className="stat-label">Current Crop</div>
                </div>
                <div className="stat-card">
                  <GiPlantRoots className="w-6 h-6 text-earth-600" />
                  <div className="stat-number text-2xl">{selectedFarm?.soilType || '—'}</div>
                  <div className="stat-label">Soil Type</div>
                </div>
                <div className="stat-card">
                  <FiDroplet className="w-6 h-6 text-blue-500" />
                  <div className="stat-number text-2xl">{selectedFarm?.fieldSize || '—'}</div>
                  <div className="stat-label">Field Size ({selectedFarm?.fieldSizeUnit || 'acres'})</div>
                </div>
                <div className="stat-card">
                  <div className={`w-3 h-3 rounded-full ${latestRec?.cropHealthStatus === 'Good' ? 'bg-green-500' : latestRec?.cropHealthStatus === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <div className="stat-number text-2xl">{latestRec?.cropHealthStatus || 'N/A'}</div>
                  <div className="stat-label">Crop Health</div>
                </div>
              </div>

              {/* Weather + Irrigation Row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weather Card */}
                <Card title="Weather Summary" icon={FiCloud} subtitle={weather?.location}>
                  {weatherLoading ? (
                    <div className="flex justify-center py-8"><div className="spinner w-8 h-8" /></div>
                  ) : weather ? (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                        <FiThermometer className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className="text-xl font-bold text-gray-900">{weather.temperature}°C</div>
                          <div className="text-xs text-gray-500">Temperature</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                        <FiDroplet className="w-5 h-5 text-blue-500" />
                        <div>
                          <div className="text-xl font-bold text-gray-900">{weather.humidity}%</div>
                          <div className="text-xs text-gray-500">Humidity</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-sky-50 rounded-xl p-3">
                        <FiCloud className="w-5 h-5 text-sky-500" />
                        <div>
                          <div className="text-xl font-bold text-gray-900">{weather.rainChance}%</div>
                          <div className="text-xs text-gray-500">Rain Chance</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <FiWind className="w-5 h-5 text-gray-500" />
                        <div>
                          <div className="text-xl font-bold text-gray-900">{weather.windSpeed} km/h</div>
                          <div className="text-xs text-gray-500">Wind Speed</div>
                        </div>
                      </div>
                      {weather.isMock && (
                        <p className="col-span-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-center">
                          ⚠️ Using demo weather data. Add your OpenWeatherMap API key for real data.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm py-4 text-center">No weather data available</p>
                  )}
                  <Link to="/weather" className="flex items-center gap-1 text-green-600 text-sm font-medium mt-4 hover:underline">
                    View Full Weather <FiArrowRight className="w-4 h-4" />
                  </Link>
                </Card>

                {/* Irrigation Recommendation Card */}
                <Card title="Irrigation Recommendation" icon={FiDroplet}>
                  {latestRec ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <IrrigationBadge status={latestRec.irrigationStatus} />
                        <span className="text-xs text-gray-400">
                          {latestRec.riskLevel === 'High' ? '🔴' : latestRec.riskLevel === 'Medium' ? '🟡' : '🟢'} {latestRec.riskLevel} Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{latestRec.reason}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 font-medium">Best Time:</span>
                        <span className="text-green-700 font-semibold">{latestRec.bestTime}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <FiDroplet className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-800">Last Irrigation</span>
                          </div>
                          {lastIrrigation ? (
                            <p className="text-xs text-gray-600 font-medium">
                              {new Date(lastIrrigation.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })},{' '}
                              {new Date(lastIrrigation.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">Not recorded yet</p>
                          )}
                          <button onClick={() => logActivity('Irrigation')} className="mt-2 w-full text-xs py-1.5 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                            {lastIrrigation && (Date.now() - new Date(lastIrrigation.createdAt).getTime() < 24*60*60*1000) ? '✅ Mark Again' : 'Mark Irrigated'}
                          </button>
                        </div>

                        <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100">
                          <div className="flex items-center gap-2 mb-2">
                            <FiAlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-xs font-semibold text-orange-800">Last Pesticide</span>
                          </div>
                          {lastPesticide ? (
                            <p className="text-xs text-gray-600 font-medium">
                              {new Date(lastPesticide.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })},{' '}
                              {new Date(lastPesticide.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">Not recorded yet</p>
                          )}
                          <button onClick={() => logActivity('Pesticide')} className="mt-2 w-full text-xs py-1.5 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 font-medium transition-colors">
                            {lastPesticide && (Date.now() - new Date(lastPesticide.createdAt).getTime() < 7*24*60*60*1000) ? '✅ Mark Again' : 'Mark Pesticide'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-400 text-sm mb-4">No recommendations yet. Add soil data to get started.</p>
                      <Link to="/soil-input" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
                        <FiPlus className="w-4 h-4" /> Enter Soil Data
                      </Link>
                    </div>
                  )}
                  {latestRec && (
                    <Link to="/history" className="flex items-center gap-1 text-green-600 text-sm font-medium mt-4 hover:underline">
                      View History <FiArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </Card>
              </div>

              {/* AI Assistant Card */}
              {latestRec?.assistantMessage && (
                <Card title="AI Farming Assistant" icon={FiMessageCircle} subtitle="Your personal farming advisor">
                  <div className="flex gap-3 mt-2">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <GiPlantRoots className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-2xl rounded-tl-sm px-4 py-3 flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed">{latestRec.assistantMessage}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(latestRec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Link to="/assistant" id="dashboard-assistant-link" className="flex items-center gap-1 text-green-600 text-sm font-medium mt-4 hover:underline">
                    Open AI Assistant <FiArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              )}

              {/* Quick actions */}
              <div className="grid sm:grid-cols-4 gap-4">
                <Link to="/crop-monitor" id="quick-crop-monitor-btn" className="card-hover flex items-center gap-3 group border-green-100">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <FiActivity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Crop Monitor</p>
                    <p className="text-xs text-gray-500">Live health status</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                </Link>
                <Link to="/soil-input" id="quick-soil-btn" className="card-hover flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-earth-100 rounded-xl flex items-center justify-center group-hover:bg-earth-200 transition-colors">
                    <GiPlantRoots className="w-5 h-5 text-earth-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Enter Soil Data</p>
                    <p className="text-xs text-gray-500">Update soil readings</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                </Link>
                <Link to="/weather" id="quick-weather-btn" className="card-hover flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <FiCloud className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Check Weather</p>
                    <p className="text-xs text-gray-500">View detailed forecast</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                </Link>
                <Link to="/assistant" id="quick-assistant-btn" className="card-hover flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <FiMessageCircle className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">AI Assistant</p>
                    <p className="text-xs text-gray-500">Get farming advice</p>
                  </div>
                  <FiArrowRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                </Link>
              </div>
            </div>
          )}
          </>
        );
      })()}
        </main>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default Dashboard;
