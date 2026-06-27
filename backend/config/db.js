const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log('✅ Using cached MongoDB connection');
    return cachedDb;
  }
  
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not defined in environment variables');
    throw new Error('MONGO_URI is not defined');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    cachedDb = conn;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
