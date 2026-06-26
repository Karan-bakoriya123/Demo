import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 🌱`);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-agri-gradient p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GiPlantRoots className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">FarmSense</span>
          </div>
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Welcome back, Farmer!
          </h2>
          <p className="text-green-100 text-lg leading-relaxed">
            Your farm's health data, AI recommendations, and irrigation insights are waiting for you.
          </p>
        </div>
        <div className="relative grid grid-cols-2 gap-4">
          {[
            { label: 'Irrigation Accuracy', value: '95%' },
            { label: 'Water Saved', value: '40%' },
            { label: 'Crop Health', value: 'Good' },
            { label: 'AI Uptime', value: '24/7' },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-display font-bold text-white">{item.value}</div>
              <div className="text-green-200 text-sm mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-agri-gradient rounded-xl flex items-center justify-center">
              <GiPlantRoots className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">FarmSense</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500">Enter your credentials to access your farm dashboard.</p>
          </div>

          {/* Demo credentials hint */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6 text-sm">
            <p className="font-semibold text-green-800 mb-1">🛡️ Admin Demo Credentials</p>
            <p className="text-green-700">Email: <code className="bg-green-100 px-1 rounded">admin@smartagri.com</code></p>
            <p className="text-green-700">Password: <code className="bg-green-100 px-1 rounded">admin123</code></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="spinner w-4 h-4" />
                  Signing in...
                </span>
              ) : (
                <>Sign In <FiArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Don't have an account?{' '}
            <Link to="/register" id="login-register-link" className="text-green-600 font-semibold hover:underline">
              Register as Farmer
            </Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="text-gray-400 text-xs hover:text-gray-600">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
