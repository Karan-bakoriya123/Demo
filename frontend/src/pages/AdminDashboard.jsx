import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { FiUsers, FiGrid, FiTrendingUp, FiDatabase } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="stat-number">{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [recs, setRecs] = useState([]);
  const [tab, setTab] = useState('farmers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/farms'),
      api.get('/admin/recommendations'),
    ]).then(([s, u, f, r]) => {
      setStats(s.data);
      setFarmers(u.data);
      setFarms(f.data);
      setRecs(r.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: 'farmers', label: 'Farmers', count: farmers.length },
    { id: 'farms', label: 'Farms', count: farms.length },
    { id: 'recommendations', label: 'Recommendations', count: recs.length },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="mb-8">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Overview of all farmers, farms, and AI recommendations.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner w-10 h-10" /></div>
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FiUsers} label="Total Farmers" value={stats?.totalFarmers} color="bg-green-50 text-green-600" />
                <StatCard icon={FiGrid} label="Total Farms" value={stats?.totalFarms} color="bg-blue-50 text-blue-600" />
                <StatCard icon={FiTrendingUp} label="Recommendations" value={stats?.totalRecommendations} color="bg-purple-50 text-purple-600" />
                <StatCard icon={FiDatabase} label="Soil Submissions" value={stats?.totalSoilSubmissions} color="bg-orange-50 text-orange-600" />
              </div>

              {/* Crop distribution */}
              {stats?.cropDistribution?.length > 0 && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                      <GiWheat className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-display font-semibold text-gray-900">Crop Distribution</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {stats.cropDistribution.map((c) => (
                      <div key={c._id} className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl">
                        <span className="font-semibold text-green-700">{c._id}</span>
                        <span className="bg-green-200 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">{c.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div>
                <div className="flex border-b border-gray-200 mb-6 gap-1">
                  {tabs.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${tab === t.id ? 'bg-white border border-b-white border-gray-200 text-green-700 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
                      {t.label} <span className="ml-1 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>
                    </button>
                  ))}
                </div>

                {/* Farmers Table */}
                {tab === 'farmers' && (
                  <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Location</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {farmers.map((f) => (
                            <tr key={f._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                              <td className="px-4 py-3 text-gray-500">{f.email}</td>
                              <td className="px-4 py-3 text-gray-500">{f.location || '—'}</td>
                              <td className="px-4 py-3 text-gray-400">{new Date(f.createdAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {farmers.length === 0 && <p className="text-center text-gray-400 py-8">No farmers registered yet.</p>}
                    </div>
                  </div>
                )}

                {/* Farms Table */}
                {tab === 'farms' && (
                  <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Farm Name</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Farmer</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Crop</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Location</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Size</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {farms.map((f) => (
                            <tr key={f._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">{f.farmName}</td>
                              <td className="px-4 py-3 text-gray-500">{f.userId?.name || '—'}</td>
                              <td className="px-4 py-3"><span className="badge-green">{f.cropType}</span></td>
                              <td className="px-4 py-3 text-gray-500">{f.location}</td>
                              <td className="px-4 py-3 text-gray-500">{f.fieldSize} {f.fieldSizeUnit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {farms.length === 0 && <p className="text-center text-gray-400 py-8">No farms added yet.</p>}
                    </div>
                  </div>
                )}

                {/* Recommendations Table */}
                {tab === 'recommendations' && (
                  <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Farmer</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Farm</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Health</th>
                            <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {recs.map((r) => (
                            <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 text-gray-900">{r.userId?.name || '—'}</td>
                              <td className="px-4 py-3 text-gray-500">{r.farmId?.farmName || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={r.irrigationStatus === 'Required' ? 'badge-red' : r.irrigationStatus === 'Not Required' ? 'badge-green' : 'badge-yellow'}>
                                  {r.irrigationStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={r.cropHealthStatus === 'Good' ? 'badge-green' : r.cropHealthStatus === 'Moderate' ? 'badge-yellow' : 'badge-red'}>
                                  {r.cropHealthStatus}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {recs.length === 0 && <p className="text-center text-gray-400 py-8">No recommendations yet.</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
