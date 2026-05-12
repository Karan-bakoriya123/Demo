import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddFarm from './pages/AddFarm';
import SoilInput from './pages/SoilInput';
import Weather from './pages/Weather';
import Assistant from './pages/Assistant';
import RecommendationHistory from './pages/RecommendationHistory';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Scanner from './pages/Scanner';
import RainAlert from './pages/RainAlert';
import CropMonitor from './pages/CropMonitor';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#fff',
              color: '#374151',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Farmer Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-farm" element={<ProtectedRoute><AddFarm /></ProtectedRoute>} />
          <Route path="/soil-input" element={<ProtectedRoute><SoilInput /></ProtectedRoute>} />
          <Route path="/weather" element={<ProtectedRoute><Weather /></ProtectedRoute>} />
          <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><RecommendationHistory /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/scanner" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/rain-alert" element={<ProtectedRoute><RainAlert /></ProtectedRoute>} />
          <Route path="/crop-monitor" element={<ProtectedRoute><CropMonitor /></ProtectedRoute>} />

          {/* Admin Protected */}
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
