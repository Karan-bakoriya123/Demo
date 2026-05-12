import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiCloud, FiDroplet, FiThermometer, FiWind, FiSearch, FiRefreshCw } from 'react-icons/fi';

const WeatherStat = ({ icon: Icon, label, value, color }) => (
  <div className={`flex flex-col items-center justify-center p-4 rounded-2xl ${color}`}>
    <Icon className="w-6 h-6 mb-2" />
    <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
    <div className="text-xs text-gray-500 font-medium mt-0.5">{label}</div>
  </div>
);

const Weather = () => {
  const { user } = useAuth();
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (loc) => {
    if (!loc) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/weather?location=${encodeURIComponent(loc)}`);
      setWeather(data);
      setLocation(loc);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not fetch weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initLocation = async () => {
      try {
        const { data: farmsData } = await api.get('/farms');
        const defaultLoc = farmsData?.length > 0 ? farmsData[0].location : (user?.location || 'Dewas');
        setSearchInput(defaultLoc);
        fetchWeather(defaultLoc);
      } catch (e) {
        const defaultLoc = user?.location || 'Dewas';
        setSearchInput(defaultLoc);
        fetchWeather(defaultLoc);
      }
    };
    initLocation();
  }, [user?.location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) fetchWeather(searchInput.trim());
  };

  const getRainAdvice = (chance) => {
    if (chance > 70) return { text: 'Heavy rain expected. No irrigation needed today.', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (chance > 40) return { text: 'Moderate rain possible. Wait before irrigating.', color: 'text-yellow-700', bg: 'bg-yellow-50' };
    return { text: 'Low rain chance. Check soil moisture and irrigate if needed.', color: 'text-red-700', bg: 'bg-red-50' };
  };

  const advice = weather ? getRainAdvice(weather.rainChance) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="page-title">Weather Information</h1>
              <p className="page-subtitle">Real-time weather data for your farm location.</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  id="weather-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Enter city or village name..."
                />
              </div>
              <button type="submit" id="weather-search-btn" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <div className="spinner w-4 h-4" /> : <FiSearch className="w-4 h-4" />}
                Search
              </button>
              <button type="button" onClick={() => fetchWeather(location)} className="btn-secondary p-3">
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </form>

            {loading && (
              <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
            )}

            {weather && !loading && (
              <div className="space-y-6 animate-fade-in">
                {/* Mock data warning */}
                {weather.isMock && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                    ⚠️ Showing demo weather data. Add your OpenWeatherMap API key in <code className="bg-amber-100 px-1 rounded">backend/.env</code> for real weather.
                  </div>
                )}

                {/* Main weather card */}
                <Card>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-gray-900">{weather.location}</h2>
                      <p className="text-gray-500 capitalize">{weather.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-display font-extrabold text-gray-900">{weather.temperature}°C</div>
                      <div className="text-sm text-gray-500">Feels like {weather.feelsLike}°C</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <WeatherStat icon={FiDroplet} label="Humidity" value={`${weather.humidity}%`} color="bg-blue-50 text-blue-600" />
                    <WeatherStat icon={FiCloud} label="Rain Chance" value={`${weather.rainChance}%`} color="bg-sky-50 text-sky-600" />
                    <WeatherStat icon={FiWind} label="Wind Speed" value={`${weather.windSpeed} km/h`} color="bg-gray-50 text-gray-600" />
                    <WeatherStat icon={FiThermometer} label="Pressure" value={`${weather.pressure} hPa`} color="bg-orange-50 text-orange-600" />
                  </div>
                </Card>

                {/* Farming advice based on weather */}
                <Card title="Farming Advice" subtitle="Based on current weather">
                  <div className={`rounded-xl p-4 mt-2 ${advice.bg}`}>
                    <p className={`text-sm font-medium ${advice.color}`}>🌦️ {advice.text}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">TEMPERATURE IMPACT</p>
                      {weather.temperature > 35 ? (
                        <p className="text-sm text-red-700">🌡️ Very hot! Irrigate in evening (6–8 PM) to avoid evaporation loss.</p>
                      ) : weather.temperature > 25 ? (
                        <p className="text-sm text-orange-700">☀️ Warm day. Morning irrigation (6–10 AM) is recommended.</p>
                      ) : (
                        <p className="text-sm text-green-700">🌤️ Mild temperature. Any time is suitable for irrigation.</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-semibold text-gray-500 mb-2">HUMIDITY IMPACT</p>
                      {weather.humidity < 30 ? (
                        <p className="text-sm text-red-700">💨 Very dry air. Crops may lose water faster. Monitor soil closely.</p>
                      ) : weather.humidity > 80 ? (
                        <p className="text-sm text-blue-700">💧 High humidity. Watch for fungal diseases. Avoid over-watering.</p>
                      ) : (
                        <p className="text-sm text-green-700">✅ Humidity is comfortable for most crops.</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Weather;
