import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import { FiClock, FiDroplet, FiAlertTriangle, FiCheckCircle, FiFilter } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const StatusChip = ({ status }) => {
  const map = {
    'Required': 'badge-red',
    'Not Required': 'badge-green',
    'Optional': 'badge-yellow',
  };
  return <span className={map[status] || 'badge-yellow'}>{status}</span>;
};

const HealthChip = ({ status }) => {
  const map = { Good: 'badge-green', Moderate: 'badge-yellow', Poor: 'badge-red' };
  return <span className={map[status] || 'badge-yellow'}>{status}</span>;
};

const RecommendationHistory = () => {
  const [recs, setRecs] = useState([]);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/recommendations'), api.get('/farms')]).then(([recRes, farmRes]) => {
      setRecs(recRes.data);
      setFarms(farmRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = selectedFarmId ? recs.filter((r) => r.farmId?._id === selectedFarmId) : recs;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">Recommendation History</h1>
              <p className="page-subtitle">View all past AI irrigation recommendations.</p>
            </div>
            {farms.length > 1 && (
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-400" />
                <select value={selectedFarmId} onChange={(e) => setSelectedFarmId(e.target.value)} className="input-field w-auto text-sm py-2">
                  <option value="">All Farms</option>
                  {farms.map((f) => <option key={f._id} value={f._id}>{f.farmName}</option>)}
                </select>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-display font-semibold text-gray-700 mb-2">No recommendations yet</h3>
              <p className="text-gray-400 text-sm">Enter soil data to generate your first AI recommendation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{filtered.length} recommendation{filtered.length !== 1 ? 's' : ''} found</p>
              {filtered.map((rec) => (
                <div key={rec._id} className="card cursor-pointer" onClick={() => setExpanded(expanded === rec._id ? null : rec._id)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <GiPlantRoots className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{rec.farmId?.farmName || 'Unknown Farm'}</p>
                        <p className="text-xs text-gray-400">{rec.farmId?.cropType} · {rec.farmId?.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StatusChip status={rec.irrigationStatus} />
                      <HealthChip status={rec.cropHealthStatus} />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${rec.riskLevel === 'High' ? 'bg-red-100 text-red-700' : rec.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {rec.riskLevel} Risk
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(rec.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {expanded === rec._id && (
                    <div className="mt-4 border-t border-gray-100 pt-4 space-y-4 animate-fade-in">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">REASON</p>
                          <p className="text-sm text-gray-700">{rec.reason}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1">BEST TIME TO IRRIGATE</p>
                          <p className="text-sm text-green-700 font-medium">{rec.bestTime}</p>
                        </div>
                      </div>
                      {rec.weatherData?.temperature && (
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center bg-orange-50 rounded-xl p-2">
                            <div className="font-bold text-sm">{rec.weatherData.temperature}°C</div>
                            <div className="text-xs text-gray-500">Temp</div>
                          </div>
                          <div className="text-center bg-blue-50 rounded-xl p-2">
                            <div className="font-bold text-sm">{rec.weatherData.humidity}%</div>
                            <div className="text-xs text-gray-500">Humidity</div>
                          </div>
                          <div className="text-center bg-sky-50 rounded-xl p-2">
                            <div className="font-bold text-sm">{rec.weatherData.rainChance}%</div>
                            <div className="text-xs text-gray-500">Rain</div>
                          </div>
                          <div className="text-center bg-gray-50 rounded-xl p-2">
                            <div className="font-bold text-sm">{rec.weatherData.windSpeed} km/h</div>
                            <div className="text-xs text-gray-500">Wind</div>
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <GiPlantRoots className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex-1">
                          <p className="text-xs text-gray-600 leading-relaxed">{rec.assistantMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-green-600 mt-2">{expanded === rec._id ? '▲ Collapse' : '▼ View Details'}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RecommendationHistory;
