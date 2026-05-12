import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiMapPin, FiEdit3, FiSave, FiX } from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState([]);
  const [stats, setStats] = useState({ farms: 0, recommendations: 0 });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, phone: user.phone || '', location: user.location || '' });
    }
    api.get('/farms').then(({ data }) => {
      setFarms(data);
      setStats((s) => ({ ...s, farms: data.length }));
    });
    api.get('/recommendations').then(({ data }) => {
      setStats((s) => ({ ...s, recommendations: data.length }));
    });
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="page-title">My Profile</h1>
              <p className="page-subtitle">Manage your account and view your farming summary.</p>
            </div>

            {/* Profile card */}
            <Card className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-agri-gradient rounded-2xl flex items-center justify-center shadow-sm">
                  <span className="text-2xl font-display font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-display font-bold text-gray-900">{user?.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                      {user?.role === 'admin' ? '🛡️ Admin' : '🌾 Farmer'}
                    </span>
                    <span className="text-xs text-gray-400">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
                {!editing && (
                  <button id="profile-edit-btn" onClick={() => setEditing(true)} className="btn-secondary text-sm flex items-center gap-2">
                    <FiEdit3 className="w-4 h-4" /> Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="input-label">Full Name</label>
                    <input id="profile-name" name="name" value={form.name} onChange={handleChange} className="input-field" />
                  </div>
                  <div>
                    <label className="input-label">Phone Number</label>
                    <input id="profile-phone" name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 98765..." />
                  </div>
                  <div>
                    <label className="input-label">Village / City</label>
                    <input id="profile-location" name="location" value={form.location} onChange={handleChange} className="input-field" placeholder="e.g. Dewas" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setEditing(false)} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <FiX className="w-4 h-4" /> Cancel
                    </button>
                    <button id="profile-save-btn" onClick={handleSave} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {loading ? <div className="spinner w-4 h-4" /> : <FiSave className="w-4 h-4" />} Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-100 pt-4">
                  <InfoRow icon={FiUser} label="Full Name" value={user?.name} />
                  <InfoRow icon={FiMail} label="Email Address" value={user?.email} />
                  <InfoRow icon={FiPhone} label="Phone" value={user?.phone} />
                  <InfoRow icon={FiMapPin} label="Location" value={user?.location} />
                </div>
              )}
            </Card>

            {/* Farming summary */}
            {user?.role === 'farmer' && (
              <Card title="Farming Summary">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-display font-bold text-green-700">{stats.farms}</div>
                    <div className="text-sm text-gray-500 mt-1">Farms</div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <div className="text-3xl font-display font-bold text-blue-700">{stats.recommendations}</div>
                    <div className="text-sm text-gray-500 mt-1">Recommendations</div>
                  </div>
                </div>

                {farms.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">My Farms</p>
                    <div className="space-y-2">
                      {farms.map((f) => (
                        <div key={f._id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <GiWheat className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{f.farmName}</p>
                            <p className="text-xs text-gray-400">{f.cropType} · {f.location}</p>
                          </div>
                          <span className="text-xs text-gray-400">{f.fieldSize} {f.fieldSizeUnit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
