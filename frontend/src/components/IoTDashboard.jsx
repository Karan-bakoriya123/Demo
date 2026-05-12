import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { FiDroplet, FiPower, FiAlertCircle } from 'react-icons/fi';

const IoTDashboard = ({ farmId }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!farmId) return;

    const fetchStatus = async () => {
      try {
        const response = await axios.get(`/iot/${farmId}`);
        if (response.data.success) {
          setStatus(response.data.data);
          setError(null);
        }
      } catch (err) {
        // If 404, it means no data yet. Just let the UI show 0% and OFF.
        if (err.response?.status !== 404) {
          console.error('Error fetching IoT status:', err);
          // Only show hard errors if it's not a 404
          // setError('Failed to fetch sensor data');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [farmId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-center min-h-[200px] animate-pulse">
        <div className="text-gray-400 font-medium">Connecting to sensors...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FiDroplet className="text-blue-500" size={20} />
          Live Irrigation System
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status ? 'bg-green-400' : 'bg-gray-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${status ? 'bg-green-500' : 'bg-gray-500'}`}></span>
          </span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {status ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-gray-100">
          <FiAlertCircle className="text-gray-400 mb-3" size={32} />
          <p className="text-gray-600 font-medium">{error}</p>
          <p className="text-sm text-gray-400 mt-1">Ensure your ESP8266 is powered on.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Moisture Gauge */}
          <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 relative overflow-hidden group hover:border-blue-200 transition-colors">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FiDroplet size={100} />
            </div>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Soil Moisture</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-gray-800">{status?.moistureLevel || 0}%</span>
            </div>
            
            <div className="w-full bg-blue-100 rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                  (status?.moistureLevel || 0) < 40 ? 'bg-red-500' : 
                  (status?.moistureLevel || 0) < 70 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${status?.moistureLevel || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium">
              {(status?.moistureLevel || 0) < 40 ? 'Critically Dry - Irrigation Needed' : 
               (status?.moistureLevel || 0) < 70 ? 'Moderate - Monitor Levels' : 'Optimal Moisture'}
            </p>
          </div>

          {/* Motor Status */}
          <div className={`rounded-xl p-5 border relative overflow-hidden transition-colors ${
            status?.motorStatus ? 'bg-green-50/50 border-green-200' : 'bg-gray-50/50 border-gray-200'
          }`}>
             <div className={`absolute -right-4 -top-4 opacity-5 transition-opacity ${status?.motorStatus ? 'text-green-500' : 'text-gray-500'}`}>
              <FiPower size={100} />
            </div>
            <p className={`text-sm font-semibold uppercase tracking-wider mb-2 ${status?.motorStatus ? 'text-green-600' : 'text-gray-600'}`}>
              Water Pump
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className={`p-4 rounded-full shadow-sm ${
                status?.motorStatus 
                  ? 'bg-green-500 text-white shadow-green-200 animate-pulse' 
                  : 'bg-white text-gray-400 shadow-gray-100'
              }`}>
                <FiPower size={28} />
              </div>
              <div>
                <span className={`text-3xl font-bold ${status?.motorStatus ? 'text-green-600' : 'text-gray-700'}`}>
                  {status?.motorStatus ? 'ON' : 'OFF'}
                </span>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  {status?.motorStatus ? 'Currently irrigating field' : 'Standby mode'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {status && (
        <div className="mt-4 text-right">
          <p className="text-xs text-gray-400">
            Last updated: {new Date(status.updatedAt).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default IoTDashboard;
