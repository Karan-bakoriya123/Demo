const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { seedAdmin } = require('./utils/seedAdmin');

// Routes
const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');
const soilRoutes = require('./routes/soilRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const scannerRoutes = require('./routes/scannerRoutes');
const cropMonitorRoutes = require('./routes/cropMonitorRoutes');
const iotRoutes = require('./routes/iotRoutes');

dotenv.config();

const app = express();

// Middleware (CORS first)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Non-blocking DB Connection
connectDB().then(() => {
  seedAdmin().catch(err => console.error('Seed error:', err));
}).catch(err => console.error('Initial DB Connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/crop-monitor', cropMonitorRoutes);
app.use('/api/iot', iotRoutes);

app.get('/', (req, res) => {
  res.json({ message: '🌱 API is Live!', version: '1.2.0' });
});

// For Vercel Serverless, we export the app. For local development, we start the server.
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

module.exports = app;
