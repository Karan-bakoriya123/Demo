import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Card from '../components/Card';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiCamera, FiUpload, FiX, FiRefreshCw } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const Scanner = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('leaf'); // 'leaf' or 'soil'
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileRef = useRef(null);

  // Open camera
  const openCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // back camera on phones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraOpen(true);
      // Wait for video ref to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permissions or upload an image instead.');
      console.error('Camera error:', err);
    }
  }, []);

  // Close camera
  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImage(dataUrl);
    setPreview(dataUrl);
    setResult(null);
    closeCamera();
  }, [closeCamera]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
      setPreview(reader.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Analyze the image
  const analyzeImage = async () => {
    if (!image) return toast.error('Please capture or upload an image first.');
    setLoading(true);
    try {
      const endpoint = mode === 'leaf' ? '/scanner/leaf' : '/scanner/soil';
      const { data } = await api.post(endpoint, { image });
      setResult(data);
      toast.success(`${mode === 'leaf' ? 'Leaf' : 'Soil'} analysis complete! 🌱`);
    } catch (err) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset everything
  const resetScanner = () => {
    closeCamera();
    setImage(null);
    setPreview(null);
    setResult(null);
  };

  // ─── Visual Progress Bar ───────────────────────────────────────────────────
  const ProgressBar = ({ label, value, min, max, unit, hint }) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || min;
    const pct = Math.min(Math.max(((numValue - min) / (max - min)) * 100, 0), 100);
    return (
      <div className="mb-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <span className="text-sm font-bold text-green-700">{numValue}{unit}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min}{unit}</span>
          {hint && <span className="text-amber-600 font-medium">{hint}</span>}
          <span>{max}{unit}</span>
        </div>
      </div>
    );
  };

  // ─── Status Badge ──────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const colors = {
      Healthy: 'bg-green-100 text-green-700',
      Moderate: 'bg-amber-100 text-amber-700',
      Unhealthy: 'bg-orange-100 text-orange-700',
      Critical: 'bg-red-100 text-red-700',
      Unknown: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || colors.Unknown}`}>
        {status}
      </span>
    );
  };

  // ─── Leaf Result Card ──────────────────────────────────────────────────────
  const LeafResult = ({ data }) => (
    <div className="space-y-4 animate-fade-in">
      {data.isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ Demo mode — Gemini API key nahi mili. Real analysis ke liye .env mein GEMINI_API_KEY add karein.
        </div>
      )}
      {/* Plant Name & Health overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 rounded-xl p-4 gap-4">
        <div>
          {data.plantName && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 font-medium">Plant Identified</p>
              <p className="text-xl font-bold text-green-700">{data.plantName}</p>
            </div>
          )}
          <p className="text-xs text-gray-500 font-medium">Health Status</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={data.healthStatus} />
            <span className="text-2xl font-display font-bold text-gray-900">{data.healthScore}%</span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-full border-4 border-green-200 flex items-center justify-center"
          style={{ borderColor: data.healthScore > 70 ? '#86efac' : data.healthScore > 40 ? '#fde68a' : '#fca5a5' }}>
          <span className="text-lg font-bold">{data.healthScore > 70 ? '✅' : data.healthScore > 40 ? '⚠️' : '❌'}</span>
        </div>
      </div>

      {/* Disease */}
      {data.disease && data.disease !== 'None' && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 mb-1">🦠 Disease Detected</p>
          <p className="font-bold text-red-800">{data.disease}</p>
          <p className="text-sm text-red-600 mt-1">Confidence: {data.diseaseConfidence}%</p>
        </div>
      )}

      {/* Details */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-600 mb-1">📋 Analysis</p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.details}</p>
      </div>

      {/* Pesticide */}
      <div className={`rounded-xl p-4 border ${data.pesticide?.needed ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
        <p className="text-xs font-semibold mb-1">{data.pesticide?.needed ? '🧪 Pesticide Required' : '✅ No Pesticide Needed'}</p>
        {data.pesticide?.needed && (
          <div className="text-sm space-y-1 mt-2">
            <p><strong>Name:</strong> {data.pesticide.name}</p>
            <p><strong>Dosage:</strong> {data.pesticide.dosage}</p>
            <p><strong>Timing:</strong> {data.pesticide.timing}</p>
          </div>
        )}
      </div>

      {/* Water & Harvest */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl p-4 border ${data.waterStatus?.deficiency ? 'bg-red-50 border-red-100' : 'bg-cyan-50 border-cyan-100'}`}>
          <p className="text-xs font-semibold mb-1">💧 Water Status</p>
          <p className="text-sm">{data.waterStatus?.message}</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p className="text-xs font-semibold mb-1">🌾 Harvest Estimate</p>
          <p className="text-2xl font-bold text-amber-700">{data.harvestEstimate?.daysRemaining} days</p>
          <p className="text-xs text-gray-500">{data.harvestEstimate?.message}</p>
        </div>
      </div>

      {/* Tips */}
      {data.tips && data.tips.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-green-700 mb-2">💡 Farming Tips</p>
          <ul className="space-y-1.5">
            {data.tips.map((tip, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  // ─── Soil Result Card ──────────────────────────────────────────────────────
  const SoilResult = ({ data }) => (
    <div className="space-y-4 animate-fade-in">
      {data.isMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ Demo mode — Gemini API key nahi mili. Real analysis ke liye .env mein GEMINI_API_KEY add karein.
        </div>
      )}
      {/* Soil overview */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-xs text-amber-600 font-medium">Soil Type</p>
            <p className="text-xl font-display font-bold text-gray-900 mt-1">{data.soilType}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Color</p>
            <p className="font-medium text-gray-700">{data.soilColor}</p>
          </div>
        </div>
        
        {/* Visual Bars for Moisture and pH */}
        <div className="bg-white rounded-xl p-4 border border-amber-100 space-y-2 mt-2">
          <ProgressBar 
            label="Soil Moisture" value={data.moisture} 
            min={0} max={100} unit="%" 
            hint={data.moisture < 30 ? '⚠️ Low' : data.moisture > 70 ? '⚠️ High' : ''} 
          />
          <ProgressBar 
            label="Soil pH" value={data.pH} 
            min={0} max={14} unit="" 
            hint={data.pH < 6 ? '⚠️ Acidic' : data.pH > 8 ? '⚠️ Alkaline' : '✓ Optimal'} 
          />
        </div>
      </div>

      {/* Details */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-600 mb-1">📋 Analysis</p>
        <p className="text-sm text-gray-700 leading-relaxed">{data.details}</p>
      </div>

      {/* Suitable Crops */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-green-700 mb-3">🌾 Best Crops for This Soil</p>
        <div className="space-y-2">
          {data.suitableCrops?.map((crop, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-gray-800">{crop.name}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                crop.suitability === 'Excellent' ? 'bg-green-100 text-green-700' :
                crop.suitability === 'Good' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>{crop.suitability}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrients (NPK Bars) */}
      {data.nutrients && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-purple-700 mb-3 flex items-center gap-2">
            <GiPlantRoots className="w-4 h-4" /> Nutrient Levels (kg/ha)
          </p>
          <div className="bg-white rounded-xl p-4 border border-purple-100 space-y-2">
            <ProgressBar 
              label="Nitrogen (N)" value={data.nutrients.nitrogen} 
              min={0} max={200} unit=" kg/ha" 
            />
            <ProgressBar 
              label="Phosphorus (P)" value={data.nutrients.phosphorus} 
              min={0} max={150} unit=" kg/ha" 
            />
            <ProgressBar 
              label="Potassium (K)" value={data.nutrients.potassium} 
              min={0} max={200} unit=" kg/ha" 
            />
          </div>
        </div>
      )}

      {/* Improvements */}
      {data.improvements && data.improvements.length > 0 && (
        <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4">
          <p className="text-xs font-semibold text-cyan-700 mb-2">🔧 Soil Improvement Tips</p>
          <ul className="space-y-1.5">
            {data.improvements.map((tip, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-cyan-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button 
        onClick={() => navigate('/soil-input', { 
          state: { 
            scannedData: {
              soilMoisture: parseFloat(data.moisture) || 40,
              soilPH: parseFloat(data.pH) || 6.5,
              nitrogen: parseFloat(data.nutrients?.nitrogen) || 50,
              phosphorus: parseFloat(data.nutrients?.phosphorus) || 30,
              potassium: parseFloat(data.nutrients?.potassium) || 30
            }
          } 
        })}
        className="w-full mt-6 btn-primary flex items-center justify-center gap-2 py-3"
      >
        <GiPlantRoots className="w-5 h-5" /> Update Soil Data
      </button>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="page-title">Crop & Soil Scanner</h1>
                <p className="page-subtitle">Scan leaves or soil with your camera for instant AI analysis.</p>
              </div>
              {(image || result) && (
                <button onClick={resetScanner} className="btn-secondary flex items-center gap-2 text-sm">
                  <FiRefreshCw className="w-4 h-4" /> Reset
                </button>
              )}
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setMode('leaf'); resetScanner(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  mode === 'leaf'
                    ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                🌿 Leaf Scanner
              </button>
              <button
                onClick={() => { setMode('soil'); resetScanner(); }}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  mode === 'soil'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-200'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300'
                }`}
              >
                🪨 Soil Scanner
              </button>
            </div>

            {/* Camera / Upload area */}
            {!image && !cameraOpen && (
              <Card>
                <div className="text-center py-8">
                  <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                    mode === 'leaf' ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    <span className="text-4xl">{mode === 'leaf' ? '🌿' : '🪨'}</span>
                  </div>
                  <h2 className="text-lg font-display font-bold text-gray-900 mb-2">
                    {mode === 'leaf' ? 'Scan a Leaf' : 'Scan Soil'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                    {mode === 'leaf'
                      ? 'Take a clear photo of a leaf to check crop health, detect diseases, and get pesticide advice.'
                      : 'Take a photo of your soil to identify soil type, suitable crops, and get improvement tips.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button onClick={openCamera} className="btn-primary flex items-center gap-2">
                      <FiCamera className="w-4 h-4" /> Open Camera
                    </button>
                    <button onClick={() => fileRef.current?.click()} className="btn-secondary flex items-center gap-2">
                      <FiUpload className="w-4 h-4" /> Upload Photo
                    </button>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </Card>
            )}

            {/* Camera view */}
            {cameraOpen && (
              <Card>
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl" style={{ maxHeight: '400px', objectFit: 'cover' }} />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <button onClick={capturePhoto}
                      className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform border-4 border-green-500">
                      <FiCamera className="w-6 h-6 text-green-600" />
                    </button>
                    <button onClick={closeCamera}
                      className="w-12 h-12 bg-red-500 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                      <FiX className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Preview & Analyze */}
            {image && !loading && !result && (
              <Card>
                <div className="space-y-4">
                  <img src={preview} alt="Captured" className="w-full rounded-xl object-cover" style={{ maxHeight: '350px' }} />
                  <div className="flex gap-3">
                    <button onClick={resetScanner} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <FiRefreshCw className="w-4 h-4" /> Retake
                    </button>
                    <button onClick={analyzeImage} className={`flex-1 flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-xl transition-all ${
                      mode === 'leaf' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'
                    }`}>
                      <GiPlantRoots className="w-4 h-4" /> Analyze {mode === 'leaf' ? 'Leaf' : 'Soil'}
                    </button>
                  </div>
                </div>
              </Card>
            )}

            {/* Loading */}
            {loading && (
              <Card>
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
                  <p className="font-medium text-gray-700">AI analyzing your {mode === 'leaf' ? 'leaf' : 'soil'}...</p>
                  <p className="text-sm text-gray-400 mt-1">This may take a few seconds.</p>
                </div>
              </Card>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-4">
                {/* Show the scanned image small */}
                {preview && (
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                    <img src={preview} alt="Scanned" className="w-16 h-16 rounded-lg object-cover" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{mode === 'leaf' ? '🌿 Leaf Scan' : '🪨 Soil Scan'} Complete</p>
                      <p className="text-xs text-gray-400">Results below</p>
                    </div>
                  </div>
                )}
                <Card>
                  {mode === 'leaf' ? <LeafResult data={result} /> : <SoilResult data={result} />}
                </Card>
              </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Scanner;
