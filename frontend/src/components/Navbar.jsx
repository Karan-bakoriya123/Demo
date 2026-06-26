import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  FiMenu, FiX, FiLogOut, FiUser, FiGrid,
} from 'react-icons/fi';
import {
  GiPlantRoots, GiWheat,
} from 'react-icons/gi';
import Sidebar from './Sidebar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors lg:hidden"
                id="open-sidebar-btn"
              >
                <FiMenu className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-agri-gradient rounded-xl flex items-center justify-center shadow-sm">
                <GiPlantRoots className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-gray-900 hidden sm:block">FarmSense</span>
            </Link>
          </div>

          {/* Right: User menu */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                <span className="text-xs text-green-600 capitalize font-medium">{user.role}</span>
              </div>
              <select 
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl px-2 py-1 focus:ring-green-500 focus:border-green-500"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="hi">हिन्दी</option>
                <option value="en">English</option>
              </select>
              <Link to="/profile" id="navbar-profile-link" className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors">
                <FiUser className="w-4 h-4 text-green-700" />
              </Link>
              <button
                onClick={handleLogout}
                id="navbar-logout-btn"
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-sm font-medium"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-secondary text-sm py-2 px-4">Login</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-agri-gradient rounded-xl flex items-center justify-center">
                  <GiPlantRoots className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-gray-900">FarmSense</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl hover:bg-gray-100">
                <FiX className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
