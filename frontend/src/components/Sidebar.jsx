import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiPlus, FiDroplet, FiCloud, FiMessageCircle,
  FiClock, FiUser, FiShield, FiLogOut, FiCamera, FiAlertTriangle, FiActivity,
} from 'react-icons/fi';
import { GiPlantRoots } from 'react-icons/gi';

const farmerLinks = [
  { to: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/crop-monitor', icon: FiActivity, label: '🌿 Crop Monitor' },
  { to: '/add-farm', icon: FiPlus, label: 'Add Farm' },
  { to: '/add-irrigation', icon: FiDroplet, label: 'Add Irrigation' },
  { to: '/soil-input', icon: GiPlantRoots, label: 'Soil Data' },
  { to: '/weather', icon: FiCloud, label: 'Weather' },
  { to: '/rain-alert', icon: FiAlertTriangle, label: 'Rain Alert 🌧️' },
  { to: '/assistant', icon: FiMessageCircle, label: 'AI Assistant' },
  { to: '/scanner', icon: FiCamera, label: 'Scanner' },
  { to: '/history', icon: FiClock, label: 'History' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

const adminLinks = [
  { to: '/admin', icon: FiShield, label: 'Admin Dashboard' },
  { to: '/profile', icon: FiUser, label: 'Profile' },
];

const Sidebar = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? adminLinks : farmerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex flex-col h-full py-4 px-3 gap-1 overflow-y-auto">
      {links.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          id={`sidebar-link-${label.toLowerCase().replace(/ /g, '-')}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <Icon className="w-4.5 h-4.5 flex-shrink-0" />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto pt-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          id="sidebar-logout-btn"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
        >
          <FiLogOut className="w-4.5 h-4.5" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
