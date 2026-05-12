import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiDroplet, FiCloud, FiThermometer, FiAlertTriangle, FiCheckCircle,
  FiRefreshCw, FiBell, FiBellOff, FiX, FiArrowRight, FiActivity,
  FiCalendar, FiSun, FiWind, FiTarget,
} from 'react-icons/fi';
import { GiWheat, GiPlantRoots, GiWaterDrop, GiChemicalDrop } from 'react-icons/gi';
import { MdSprinkler, MdOutlineScience } from 'react-icons/md';

