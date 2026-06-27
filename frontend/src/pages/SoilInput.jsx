import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSave, FiInfo, FiCamera, FiUpload, FiX, FiRefreshCw, FiZap } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

// ─── Slider Field ─────────────────────────────────────────────────────────────
const SliderField = ({ id, name, label, value, onChange, min, max, step = 1, unit, hint }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="input-label mb-0">{label}</label>
        <span className="text-sm font-bold text-green-700">{value}{unit}</span>
      </div>
      <input
        id={id} name={name} type="range" min={min} max={max} step={step}
        value={value} onChange={onChange}
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

// ─── Embedded Soil Scanner ────────────────────────────────────────────────────
const SoilScanner = ({ onScanComplete }) => {
  const [scanStep, setScanStep] = useState('idle'); // idle | camera | preview | scanning | result
  const [preview, setPreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setScanStep('camera');
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      }, 100);
    } catch {
      toast.error('Camera permission denied. Please upload a photo instead.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.8);
    setImageData(dataUrl); setPreview(dataUrl); setScanStep('preview');
    closeCamera();
  }, [closeCamera]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return toast.error('Please select an image file.');
    const reader = new FileReader();
    reader.onloadend = () => { setImageData(reader.result); setPreview(reader.result); setScanStep('preview'); };
    reader.readAsDataURL(file);
  };

  const analyzeSoil = async () => {
    if (!imageData) return;
    setScanStep('scanning');
    try {
      const { data } = await api.post('/scanner/soil', { image: imageData });
      setScanResult(data);
      setScanStep('result');
      toast.success('Soil scanned! Data auto-filled below. 🌱');
    } catch {
      toast.error('Scan failed. Please try again.');
      setScanStep('preview');
    }
  };

  const applyToForm = () => {
    if (!scanResult) return;
    onScanComplete({
      soilMoisture: Math.round(parseFloat(scanResult.moisture) || 45),
      soilPH: parseFloat(scanResult.pH) || 6.5,
      nitrogen: Math.round(parseFloat(scanResult.nutrients?.nitrogen) || 55),
      phosphorus: Math.round(parseFloat(scanResult.nutrients?.phosphorus) || 30),
      potassium: Math.round(parseFloat(scanResult.nutrients?.potassium) || 40),
    });
    toast.success('Form filled from scan! ✅');
  };

  const resetScan = () => {
    closeCamera(); setPreview(null); setImageData(null); setScanResult(null); setScanStep('idle');
  };

  // ─── Idle State ───────────────────────────────────────────────────────────
  if (scanStep === 'idle') {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center text-lg">🪨</div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Soil Scanner</p>
              <p className="text-xs text-gray-500">Apni mitti ka photo le — AI baaki sab fill karega</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={openCamera} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <FiCamera className="w-4 h-4" /> Camera se Scan
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <FiUpload className="w-4 h-4" /> Photo Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
        </div>
      </div>
    );
  }

  // ─── Camera ───────────────────────────────────────────────────────────────
  if (scanStep === 'camera') {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden border border-amber-200">
        <div className="relative bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: '320px', objectFit: 'cover' }} />
          {/* Overlay guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-dashed border-amber-400 rounded-xl w-48 h-32 opacity-60" />
          </div>
          <p className="absolute top-3 left-0 right-0 text-center text-white text-xs font-medium opacity-80">Mitti ko frame ke andar rakhein</p>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <button onClick={capturePhoto} className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform border-4 border-amber-500">
              <FiCamera className="w-6 h-6 text-amber-600" />
            </button>
            <button onClick={resetScan} className="w-12 h-12 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
              <FiX className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ─── Preview ──────────────────────────────────────────────────────────────
  if (scanStep === 'preview') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <img src={preview} alt="Soil preview" className="w-full h-40 object-cover rounded-xl mb-3" />
        <div className="flex gap-2">
          <button onClick={resetScan} className="flex-1 bg-white border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2">
            <FiRefreshCw className="w-4 h-4" /> Retake
          </button>
          <button onClick={analyzeSoil} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
            <FiZap className="w-4 h-4" /> Analyze Soil
          </button>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ─── Scanning ─────────────────────────────────────────────────────────────
  if (scanStep === 'scanning') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
        <p className="font-medium text-amber-800">AI mitti analyze kar raha hai...</p>
        <p className="text-xs text-gray-500 mt-1">NPK, pH, Moisture detect ho raha hai</p>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (scanStep === 'result' && scanResult) {
    const nutrients = scanResult.nutrients || {};
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img src={preview} alt="scanned" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <p className="font-bold text-amber-800 text-sm">✅ Scan Complete!</p>
              <p className="text-xs text-gray-500">{scanResult.soilType || 'Mitti analyzed'} · {scanResult.soilColor || ''}</p>
            </div>
          </div>
          <button onClick={resetScan} className="text-gray-400 hover:text-gray-600"><FiX className="w-4 h-4" /></button>
        </div>

        {/* Quick preview of values */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Moisture', value: `${Math.round(scanResult.moisture || 45)}%` },
            { label: 'pH Level', value: parseFloat(scanResult.pH || 6.5).toFixed(1) },
            { label: 'Nitrogen', value: `${Math.round(nutrients.nitrogen || 55)} kg/ha` },
            { label: 'Phosphorus', value: `${Math.round(nutrients.phosphorus || 30)} kg/ha` },
            { label: 'Potassium', value: `${Math.round(nutrients.potassium || 40)} kg/ha` },
            { label: 'Soil Type', value: scanResult.soilType?.split(' ')[0] || 'Loamy' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-xl p-2 text-center border border-amber-100">
              <p className="font-bold text-amber-700 text-sm">{item.value}</p>
              <p className="text-xs text-gray-400">{item.label}</p>
            </div>
          ))}
        </div>

        {scanResult.isMock && (
          <p className="text-xs text-amber-600 bg-amber-100 rounded-lg p-2 mb-3 text-center">
            ⚠️ Demo values — Real AI ke liye Gemini API Key add karein
          </p>
        )}

        <button onClick={applyToForm} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
          <GiPlantRoots className="w-4 h-4" /> Form me Apply Karen ↓
        </button>
      </div>
    );
  }

  return null;
};

// ─── Main SoilInput Page ──────────────────────────────────────────────────────
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
          ...prev, farmId: fId,
          soilMoisture: data.soilMoisture || 40, soilPH: data.soilPH || 6.5,
          nitrogen: data.nitrogen || 50, phosphorus: data.phosphorus || 30, potassium: data.potassium || 30
        }));
      }
    } catch (_) {}
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

  // Called by embedded scanner when scan is complete
  const handleScanComplete = (scannedValues) => {
    setForm(prev => ({ ...prev, ...scannedValues }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'farmId') fetchLatestSoil(value);
  };
  const handleSlider = (e) => setForm({ ...form, [e.target.name]: Number(e.target.value) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.farmId) return toast.error('Please select a farm');
    setLoading(true);
    try {
      const { data: soilRes } = await api.post('/soil', form);
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
      setLoading(false); setGenerating(false);
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
            <div className="mb-6">
              <h1 className="page-title">Soil Data</h1>
              <p className="page-subtitle">Scan ya manually apni mitti ki details darj karein.</p>
            </div>

            {/* ─── Embedded Scanner ─── */}
            <SoilScanner onScanComplete={handleScanComplete} />

            {/* ─── Manual Form ─── */}
            <Card>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <GiPlantRoots className="w-5 h-5 text-green-600" />
                <p className="font-semibold text-gray-700 text-sm">Manual Data Entry</p>
                <span className="text-xs text-gray-400 ml-auto">Scan ke baad values auto-filled ho jayengi</span>
              </div>
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
                  {selectedFarm && <p className="text-xs text-gray-400 mt-1">📍 {selectedFarm.location} · {selectedFarm.soilType} soil</p>}
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

                {/* Summary */}
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1"><FiInfo className="w-4 h-4" /> Summary</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="font-bold text-green-700">{form.soilMoisture}%</div><div className="text-xs text-gray-500">Moisture</div></div>
                    <div><div className="font-bold text-green-700">pH {form.soilPH}</div><div className="text-xs text-gray-500">Soil pH</div></div>
                    <div><div className="font-bold text-green-700">N{form.nitrogen}/P{form.phosphorus}/K{form.potassium}</div><div className="text-xs text-gray-500">NPK</div></div>
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
