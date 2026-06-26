import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import toast from 'react-hot-toast';
import { FiSave, FiSettings, FiDroplet } from 'react-icons/fi';

const AddIrrigation = () => {
  const [form, setForm] = useState({
    instrumentName: '',
    type: '',
    powerSource: '',
    farmAreaCovered: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.instrumentName || !form.type || !form.powerSource || !form.farmAreaCovered) {
      return toast.error('Please fill all required fields');
    }
    
    setLoading(true);
    // Simulate API call for adding irrigation instrument
    setTimeout(() => {
      setLoading(false);
      toast.success('Irrigation Instrument added successfully! 💧');
      navigate('/dashboard');
    }, 1000);
  };

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
              <h1 className="page-title flex items-center gap-2">
                <FiDroplet className="text-blue-500" /> Add Irrigation Instrument
              </h1>
              <p className="page-subtitle">Add details about your irrigation setup like pumps, sprinklers, or drip systems.</p>
            </div>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="input-label">Instrument Name *</label>
                  <input 
                    name="instrumentName" 
                    value={form.instrumentName} 
                    onChange={handleChange} 
                    className="input-field" 
                    placeholder="e.g. Main Tube Well, Drip System A" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Instrument Type *</label>
                    <div className="relative">
                      <FiSettings className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <select 
                        name="type" 
                        value={form.type} 
                        onChange={handleChange} 
                        className="input-field pl-10 appearance-none"
                      >
                        <option value="">Select Type</option>
                        <option value="Drip">Drip Irrigation</option>
                        <option value="Sprinkler">Sprinkler</option>
                        <option value="Tube Well">Tube Well</option>
                        <option value="Submersible Pump">Submersible Pump</option>
                        <option value="Surface Pump">Surface Pump</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Power Source *</label>
                    <select 
                      name="powerSource" 
                      value={form.powerSource} 
                      onChange={handleChange} 
                      className="input-field appearance-none"
                    >
                      <option value="">Select Power Source</option>
                      <option value="Electric">Electric</option>
                      <option value="Solar">Solar</option>
                      <option value="Diesel">Diesel/Petrol</option>
                      <option value="Manual">Manual</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Farm Area Covered (Acres) *</label>
                    <input 
                      name="farmAreaCovered" 
                      type="number" 
                      min="0" 
                      step="0.1" 
                      value={form.farmAreaCovered} 
                      onChange={handleChange} 
                      className="input-field" 
                      placeholder="e.g. 2.5" 
                    />
                  </div>
                  <div>
                    <label className="input-label">Operational Status</label>
                    <select 
                      name="status" 
                      value={form.status} 
                      onChange={handleChange} 
                      className="input-field appearance-none"
                    >
                      <option value="active">Active & Working</option>
                      <option value="maintenance">Under Maintenance</option>
                      <option value="broken">Broken / Needs Repair</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? <><div className="spinner w-4 h-4" />Saving...</> : <><FiSave className="w-4 h-4" /> Save Instrument</>}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddIrrigation;
