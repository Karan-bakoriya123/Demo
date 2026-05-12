import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiInfo } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const SliderField = ({ id, name, label, value, onChange, min, max, step = 1, unit, hint }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="input-label mb-0">{label}</label>
        <span className="text-sm font-bold text-green-700">{value}{unit}</span>
      </div>
      <input
        id={id}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #16a34a ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}{unit}</span>
        {hint && <span className="text-amber-600 text-xs">{hint}</span>}
        <span>{max}{unit}</span>
      </div>
    </div>
  );
};

const SoilInput = () => {
  const [farms, setFarms] = useState([]);
  const [form, setForm] = useState({ farmId: '', soilMoisture: 40, soilPH: 6.5, nitrogen: 50, phosphorus: 30, potassium: 30 });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchLatestSoil = async (fId) => {
    try {
      const { data } = await api.get(`/soil/${fId}/latest`);
      if (data) {
        setForm(prev => ({
          ...prev,
          farmId: fId,
          soilMoisture: data.soilMoisture || 40,
          soilPH: data.soilPH || 6.5,
          nitrogen: data.nitrogen || 50,
          phosphorus: data.phosphorus || 30,
          potassium: data.potassium || 30
        }));
      }
    } catch (err) {
      // If 404, it means no soil data exists yet, which is fine.
    }
  };

  useEffect(() => {
    const scannedData = location.state?.scannedData;
    
    api.get('/farms').then(({ data }) => {
      setFarms(data);
      if (data.length > 0) {
        const initialFarmId = data[0]._id;
        
        if (scannedData) {
          setForm(prev => ({ ...prev, farmId: initialFarmId, ...scannedData }));
          toast.success('Soil data auto-filled from Scanner! 🌱');
          window.history.replaceState({}, document.title);
        } else {
          setForm((f) => ({ ...f, farmId: initialFarmId }));
          fetchLatestSoil(initialFarmId);
        }
      }
    }).catch(() => toast.error('Failed to load farms'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'farmId') {
      fetchLatestSoil(value);
    }
  };
  const handleSlider = (e) => setForm({ ...form, [e.target.name]: Number(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmId) return toast.error('Please select a farm');
    setLoading(true);
    try {
      const { data: soilRes } = await api.post('/soil', form);

      // Auto-generate recommendation after soil input
      const farm = farms.find((f) => f._id === form.farmId);
      try {
        setGenerating(true);
        let weather = null;
        try {
          const wRes = await api.get(`/weather?location=${encodeURIComponent(farm.location)}`);
          weather = wRes.data;
        } catch (_) {}

        await api.post('/recommendations/generate', {
          farmId: form.farmId,
          soilDataId: soilRes.soilData._id,
          weatherData: weather || { temperature: 28, humidity: 60, rainChance: 20, windSpeed: 10 },
        });
        toast.success('Soil data updated & recommendation generated! 🌱');
      } catch (_) {
        toast.success('Soil data updated successfully!');
      }
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save soil data');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const selectedFarm = farms.find((f) => f._id === form.farmId);

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
              <h1 className="page-title">Enter Soil Data</h1>
              <p className="page-subtitle">Enter your soil readings to get an AI irrigation recommendation.</p>
            </div>

            <Card>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Farm selector */}
                <div>
                  <label className="input-label">Select Farm *</label>
                  {farms.length === 0 ? (
                    <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-xl">No farms found. Please <a href="/add-farm" className="underline font-semibold">add a farm</a> first.</p>
                  ) : (
                    <select id="soil-farm-id" name="farmId" value={form.farmId} onChange={handleChange} className="input-field">
                      {farms.map((f) => <option key={f._id} value={f._id}>{f.farmName} – {f.cropType}</option>)}
                    </select>
                  )}
                  {selectedFarm && (
                    <p className="text-xs text-gray-400 mt-1">📍 {selectedFarm.location} · {selectedFarm.soilType} soil</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-6">
                  <SliderField id="soil-moisture" name="soilMoisture" label="Soil Moisture" value={form.soilMoisture} onChange={handleSlider} min={0} max={100} unit="%" hint={form.soilMoisture < 30 ? '⚠️ Low' : form.soilMoisture > 70 ? '⚠️ High' : ''} />
                  <SliderField id="soil-ph" name="soilPH" label="Soil pH" value={form.soilPH} onChange={handleSlider} min={0} max={14} step={0.1} unit="" hint={form.soilPH < 6 ? '⚠️ Acidic' : form.soilPH > 8 ? '⚠️ Alkaline' : '✓ Optimal'} />

                  <div className="bg-gray-50 rounded-xl p-4 space-y-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <GiPlantRoots className="w-4 h-4" /> Nutrient Levels (kg/ha)
                    </p>
                    <SliderField id="soil-nitrogen" name="nitrogen" label="Nitrogen (N)" value={form.nitrogen} onChange={handleSlider} min={0} max={200} unit=" kg/ha" />
                    <SliderField id="soil-phosphorus" name="phosphorus" label="Phosphorus (P)" value={form.phosphorus} onChange={handleSlider} min={0} max={150} unit=" kg/ha" />
                    <SliderField id="soil-potassium" name="potassium" label="Potassium (K)" value={form.potassium} onChange={handleSlider} min={0} max={200} unit=" kg/ha" />
                  </div>
                </div>

                {/* Summary box */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1"><FiInfo className="w-4 h-4" /> Summary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="font-bold text-green-700">{form.soilMoisture}%</div>
                      <div className="text-xs text-gray-500">Moisture</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-700">pH {form.soilPH}</div>
                      <div className="text-xs text-gray-500">Soil pH</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-700">N{form.nitrogen}/P{form.phosphorus}/K{form.potassium}</div>
                      <div className="text-xs text-gray-500">NPK</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
                  <button id="soil-submit-btn" type="submit" disabled={loading || generating || farms.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {(loading || generating) ? <><div className="spinner w-4 h-4" />{generating ? 'Generating AI Rec...' : 'Updating...'}</> : <><FiSave className="w-4 h-4" /> Update Soil Data & Get Recommendation</>}
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

export default SoilInput;
