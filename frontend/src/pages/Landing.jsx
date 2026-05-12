import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiCloud, FiDroplet, FiMessageCircle, FiArrowRight, FiShield, FiTrendingUp,
} from 'react-icons/fi';
import { GiPlantRoots, GiWheat, GiWateringCan } from 'react-icons/gi';
import { MdSensors } from 'react-icons/md';

const features = [
  {
    icon: GiWateringCan,
    color: 'bg-blue-50 text-blue-600',
    title: 'Smart Irrigation',
    desc: 'AI-powered recommendations on when and how much to irrigate based on soil and weather data.',
  },
  {
    icon: FiCloud,
    color: 'bg-sky-50 text-sky-600',
    title: 'Live Weather Data',
    desc: 'Real-time weather updates including temperature, humidity, rain forecast, and wind speed.',
  },
  {
    icon: GiPlantRoots,
    color: 'bg-green-50 text-green-600',
    title: 'Soil Analysis',
    desc: 'Track soil moisture, pH, nitrogen, phosphorus, and potassium levels for optimal crop health.',
  },
  {
    icon: FiMessageCircle,
    color: 'bg-purple-50 text-purple-600',
    title: 'AI Farming Assistant',
    desc: 'Get personalized, farmer-friendly advice based on your specific crop, soil, and weather conditions.',
  },
  {
    icon: FiTrendingUp,
    color: 'bg-orange-50 text-orange-600',
    title: 'Crop Health Monitoring',
    desc: 'Monitor crop health status and risk levels to prevent losses before they happen.',
  },
  {
    icon: FiShield,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Recommendation History',
    desc: 'Access all past irrigation recommendations and AI assistant advice at any time.',
  },
];

const stats = [
  { value: '95%', label: 'Water Saved' },
  { value: '3x', label: 'Crop Yield' },
  { value: '24/7', label: 'AI Support' },
  { value: '100%', label: 'Free to Use' },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-agri-gradient rounded-xl flex items-center justify-center shadow-sm">
              <GiPlantRoots className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">Smart Agri AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" id="landing-login-btn" className="btn-secondary text-sm py-2 px-4">Login</Link>
            <Link to="/register" id="landing-register-btn" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, #16a34a 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            AI-Powered Precision Agriculture
          </div>
          <h1 className="text-5xl sm:text-6xl font-display font-extrabold text-gray-900 leading-tight mb-6 animate-slide-up">
            Farm Smarter with
            <span className="text-gradient block">AI-Powered Insights</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Smart Agri AI Assistant helps farmers make data-driven decisions about irrigation, soil health, and crop management — all in simple, farmer-friendly language.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" id="hero-start-btn" className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2 group">
              Start for Free
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3.5">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-display font-extrabold text-gradient">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
              Everything a Farmer Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From soil analysis to AI recommendations — all in one simple platform designed for farmers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-green-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Simple 4-step process to better farming</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Register', desc: 'Create your farmer account in seconds.', icon: FiShield },
              { step: '2', title: 'Add Farm', desc: 'Enter your farm and crop details.', icon: GiWheat },
              { step: '3', title: 'Enter Soil Data', desc: 'Input soil moisture, pH, and nutrient levels.', icon: GiPlantRoots },
              { step: '4', title: 'Get AI Advice', desc: 'Receive instant irrigation and health recommendations.', icon: FiMessageCircle },
            ].map((item) => (
              <div key={item.step} className="card text-center group hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-agri-gradient rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-3 shadow-sm">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Enhancement Banner */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="card bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MdSensors className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-xl mb-1">🔮 Coming Soon: IoT Sensor Integration</h3>
                <p className="text-green-100 text-sm leading-relaxed">
                  Future enhancement will include real-time soil sensor data, automated irrigation control, and satellite crop imaging for complete precision agriculture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-agri-gradient text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-display font-bold mb-4">Ready to Farm Smarter?</h2>
          <p className="text-green-100 text-lg mb-8">Join thousands of farmers already using AI to improve their crop yield and save water.</p>
          <Link to="/register" id="cta-register-btn" className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg">
            Get Started for Free
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">© 2025 Smart Agri AI Assistant. Built for the future of farming.</p>
      </footer>
    </div>
  );
};

export default Landing;
