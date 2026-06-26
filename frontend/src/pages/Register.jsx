import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';
import { stateAgricultureData } from '../utils/locationData';

const InputField = ({ id, name, label, type = 'text', icon: Icon, placeholder, extra, form, handleChange, showPass, setShowPass }) => (
  <div>
    <label className="input-label">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
      <input
        id={id}
        name={name}
        type={extra?.showToggle ? (showPass ? 'text' : 'password') : type}
        value={form[name]}
        onChange={handleChange}
        className={`input-field pl-10 ${extra?.showToggle ? 'pr-10' : ''}`}
        placeholder={placeholder}
      />
      {extra?.showToggle && (
        <button
          type="button"
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
        </button>
      )}
    </div>
  </div>
);

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', state: '', district: '', village: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setForm({ ...form, state: value, district: '' }); // reset district when state changes
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email and password are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const locationString = [form.village, form.district, form.state].filter(Boolean).join(', ');
      
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        location: locationString,
      });
      login(data.user, data.token);
      toast.success(`Welcome to FarmSense, ${data.user.name}! 🌱`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
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
            Join Thousands of Smart Farmers
          </h2>
          <p className="text-green-100 text-lg leading-relaxed">
            Register for free and start getting AI-powered crop health and irrigation recommendations today.
          </p>
        </div>
        <div className="relative space-y-3">
          {[
            '✅ Free AI irrigation recommendations',
            '✅ Real-time weather integration',
            '✅ Soil health analysis & alerts',
            '✅ Farmer-friendly simple language',
            '✅ Mobile & desktop responsive',
          ].map((item) => (
            <p key={item} className="text-green-100 text-sm">{item}</p>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-agri-gradient rounded-xl flex items-center justify-center">
              <GiPlantRoots className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">FarmSense</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500">Register as a farmer to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField id="reg-name" name="name" label="Full Name *" icon={FiUser} placeholder="Your full name" form={form} handleChange={handleChange} />
            <InputField id="reg-email" name="email" label="Email Address *" type="email" icon={FiMail} placeholder="you@example.com" form={form} handleChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <InputField id="reg-phone" name="phone" label="Phone (Optional)" type="tel" icon={FiPhone} placeholder="+91 98765..." form={form} handleChange={handleChange} />
              <InputField id="reg-village" name="village" label="Village (Optional)" icon={FiMapPin} placeholder="e.g. Rampur" form={form} handleChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="input-label">State *</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
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
                  <FiMapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                  <select name="district" value={form.district} onChange={handleChange} disabled={!form.state} className="input-field pl-10 appearance-none disabled:bg-gray-100 disabled:text-gray-400">
                    <option value="">Select District</option>
                    {form.state && stateAgricultureData[form.state]?.districts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <InputField id="reg-password" name="password" label="Password *" icon={FiLock} placeholder="Min. 6 characters" extra={{ showToggle: true }} form={form} handleChange={handleChange} showPass={showPass} setShowPass={setShowPass} />
            <div>
              <label className="input-label">Confirm Password *</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-400" />
                <input
                  id="reg-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Repeat your password"
                />
              </div>
            </div>

            <button
              id="reg-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2"><div className="spinner w-4 h-4" /> Creating Account...</span>
              ) : (
                <>Create Account <FiArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm">
            Already have an account?{' '}
            <Link to="/login" id="reg-login-link" className="text-green-600 font-semibold hover:underline">Sign In</Link>
          </p>
          <p className="text-center mt-3">
            <Link to="/" className="text-gray-400 text-xs hover:text-gray-600">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
