import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiSend, FiRefreshCw, FiMic, FiMicOff } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const Slider = ({ name, label, min, max, step = 1, unit, form, handleSlider }) => {
  const pct = ((form[name] - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="font-bold text-green-700">{form[name]}{unit}</span>
      </div>
      <input type="range" name={name} min={min} max={max} step={step} value={form[name]} onChange={handleSlider}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #16a34a ${pct}%, #e5e7eb ${pct}%)` }} />
    </div>
  );
};

const Assistant = () => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your FarmSense Assistant. 🌱 You can either use the sliders to analyze your farm data or just type your question below.' },
  ]);
  const [form, setForm] = useState({ soilMoisture: 40, soilPH: 6.5, temperature: 28, humidity: 60, rainChance: 20, fieldSize: 5 });
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speakText = (text) => {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN'; // Speak in Hindi
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'hi-IN'; // Hindi support by default
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setUserInput(transcript);
        transcriptRef.current = transcript;
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') toast.error("माइक्रोफोन का एक्सेस दें (Allow Mic)");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcriptRef.current.trim().length > 0) {
          handleAnalyze(null, transcriptRef.current);
          transcriptRef.current = ''; // clear ref after auto-submit
        }
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return toast.error("आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता (Browser not supported).");
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setUserInput('');
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("बोलना शुरू करें... (Listening)");
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    api.get('/farms').then(({ data }) => {
      setFarms(data);
      if (data.length > 0) setSelectedFarm(data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSlider = (e) => setForm({ ...form, [e.target.name]: Number(e.target.value) });

  const handleAnalyze = async (e, overrideText = null) => {
    if (e) e.preventDefault();
    
    let queryText = overrideText || userInput;
    if (!selectedFarm && !queryText) return toast.error('Please select a farm or type a question');
    
    setLoading(true);
    
    if (!queryText) {
      queryText = `Analyze my ${selectedFarm?.cropType || 'crop'}: Moisture ${form.soilMoisture}%, pH ${form.soilPH}, Temp ${form.temperature}°C.`;
    }

    setMessages((prev) => [...prev, { role: 'user', text: queryText }]);
    setUserInput('');
    setShowForm(false);

    try {
      const { data } = await api.post('/assistant/analyze', {
        cropType: selectedFarm?.cropType || 'Wheat',
        fieldSize: selectedFarm?.fieldSize || 5,
        ...form,
        text: queryText
      });
      setMessages((prev) => [...prev, { role: 'assistant', text: data.message }]);
      speakText(data.message);
    } catch (err) {
      const fallbackMsg = 'I am here to help! Please provide your soil and weather details for a specific analysis.';
      setMessages((prev) => [...prev, { role: 'assistant', text: fallbackMsg }]);
      speakText(fallbackMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setMessages([{ role: 'assistant', text: 'Hello! I am your FarmSense Assistant. 🌱 How can I help you today?' }]);
    setShowForm(true);
    setUserInput('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-16">
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-16 bottom-0 bg-white border-r border-gray-100 shadow-sm">
          <Sidebar />
        </aside>
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="page-title">AI Farming Assistant</h1>
                <p className="page-subtitle">Get personalized farming advice based on your data.</p>
              </div>
              <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
                <FiRefreshCw className="w-4 h-4" /> Reset Chat
              </button>
            </div>

            {/* Farm selector */}
            {farms.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {farms.map((f) => (
                  <button key={f._id} onClick={() => setSelectedFarm(f)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${selectedFarm?._id === f._id ? 'bg-green-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-300'}`}>
                    {f.farmName}
                  </button>
                ))}
              </div>
            )}

            {/* Chat window */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '65vh' }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <GiPlantRoots className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-green-600 text-white rounded-tr-sm'
                        : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <GiPlantRoots className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input section */}
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50 rounded-b-2xl">
                {showForm && (
                  <div className="grid grid-cols-2 gap-3 mb-2 animate-fade-in">
                    <Slider name="soilMoisture" label="Soil Moisture" min={0} max={100} unit="%" form={form} handleSlider={handleSlider} />
                    <Slider name="soilPH" label="Soil pH" min={0} max={14} step={0.1} unit="" form={form} handleSlider={handleSlider} />
                    <Slider name="temperature" label="Temperature" min={-10} max={50} unit="°C" form={form} handleSlider={handleSlider} />
                    <Slider name="humidity" label="Humidity" min={0} max={100} unit="%" form={form} handleSlider={handleSlider} />
                  </div>
                )}
                
                <form onSubmit={handleAnalyze} className="flex gap-2">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={showForm ? "Or type your question here..." : isListening ? "Listening..." : "Type your question..."}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none text-sm"
                  />
                  <button type="button" onClick={toggleListening} className={`flex items-center justify-center px-4 rounded-xl transition-all ${isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {isListening ? <FiMicOff className="w-5 h-5 animate-pulse" /> : <FiMic className="w-5 h-5" />}
                  </button>
                  <button type="submit" disabled={loading || (!userInput && !showForm)} className="btn-primary flex items-center justify-center px-4">
                    <FiSend className="w-4 h-4" />
                  </button>
                  {!showForm && (
                    <button type="button" onClick={() => setShowForm(true)} className="btn-secondary px-4 text-xs">
                      Data
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Assistant;
