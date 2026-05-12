import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiMapPin } from 'react-icons/fi';
import { GiWheat, GiPlantRoots } from 'react-icons/gi';

import { stateAgricultureData, defaultCrops, defaultSoils } from '../utils/locationData';

const AddFarm = () => {
  const [form, setForm] = useState({ 
    farmName: '', state: '', district: '', village: '', cropType: '', soilType: '', 
    customCropType: '', customSoilType: '', fieldSize: '', fieldSizeUnit: 'acres',
    plantingDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setForm({ ...form, state: value, district: '', cropType: '', soilType: '', customCropType: '', customSoilType: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const currentCrops = form.state && stateAgricultureData[form.state] ? [...stateAgricultureData[form.state].crops, 'Other'] : [...defaultCrops, 'Other'];
  const currentSoils = form.state && stateAgricultureData[form.state] ? [...stateAgricultureData[form.state].soils, 'Other'] : [...defaultSoils, 'Other'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCropType = form.cropType === 'Other' ? form.customCropType : form.cropType;
    const finalSoilType = form.soilType === 'Other' ? form.customSoilType : form.soilType;

    if (!form.farmName || !form.state || !form.district || !finalCropType || !finalSoilType || !form.fieldSize) {
      return toast.error('All fields except village are required');
    }
    
    setLoading(true);
    try {
      const locationString = [form.village, form.district, form.state].filter(Boolean).join(', ');
      await api.post('/farms', { 
        farmName: form.farmName,
        location: locationString,
        cropType: finalCropType,
        soilType: finalSoilType,
        fieldSize: Number(form.fieldSize),
        fieldSizeUnit: form.fieldSizeUnit,
        plantingDate: form.plantingDate
      });
      toast.success('Farm added successfully! 🌾');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add farm');
    } finally {
      setLoading(false);
    }
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
              <h1 className="page-title">Add New Farm</h1>
              <p className="page-subtitle">Fill in your farm details to get personalized AI recommendations.</p>
            </div>
            <Card>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="input-label">Farm Name *</label>
                  <input id="farm-name" name="farmName" value={form.farmName} onChange={handleChange} className="input-field" placeholder="e.g. Green Valley Farm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">State *</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <select name="state" value={form.state} onChange={handleChange} className="input-field pl-10 appearance-none">
                        <option value="">Select State</option>
                        {Object.keys(stateAgricultureData).map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">District *</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                      <select name="district" value={form.district} onChange={handleChange} disabled={!form.state} className="input-field pl-10 appearance-none disabled:bg-gray-100 disabled:text-gray-400">
                        <option value="">Select District</option>
                        {form.state && stateAgricultureData[form.state]?.districts.map(district => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="input-label">Village (Optional)</label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
                    <input id="farm-village" name="village" value={form.village} onChange={handleChange} className="input-field pl-10" placeholder="e.g. Rampur" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Used to fetch real weather data for your farm.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Crop Type *</label>
                    <select id="farm-crop-type" name="cropType" value={form.cropType} onChange={handleChange} className="input-field appearance-none">
                      <option value="">Select crop type</option>
                      {currentCrops.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {form.cropType === 'Other' && (
                      <input name="customCropType" value={form.customCropType} onChange={handleChange} className="input-field mt-2" placeholder="Specify your crop" />
                    )}
                  </div>
                  <div>
                    <label className="input-label">Soil Type *</label>
                    <select id="farm-soil-type" name="soilType" value={form.soilType} onChange={handleChange} className="input-field appearance-none">
                      <option value="">Select soil type</option>
                      {currentSoils.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {form.soilType === 'Other' && (
                      <input name="customSoilType" value={form.customSoilType} onChange={handleChange} className="input-field mt-2" placeholder="Specify your soil" />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Field Size *</label>
                    <div className="flex gap-3">
                      <input id="farm-field-size" name="fieldSize" type="number" min="0" step="0.1" value={form.fieldSize} onChange={handleChange} className="input-field flex-1" placeholder="e.g. 5" />
                      <select id="farm-size-unit" name="fieldSizeUnit" value={form.fieldSizeUnit} onChange={handleChange} className="input-field w-24">
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Sowing Date (बुवाई की तारीख)</label>
                    <input type="date" name="plantingDate" value={form.plantingDate} onChange={handleChange} className="input-field" max={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
                  <button id="add-farm-submit-btn" type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {loading ? <><div className="spinner w-4 h-4" />Saving...</> : <><FiSave className="w-4 h-4" /> Save Farm</>}
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

export default AddFarm;
