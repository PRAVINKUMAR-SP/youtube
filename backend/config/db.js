const mongoose = require('mongoose');

let lastError = null;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not defined in environment variables!');
    lastError = 'MONGODB_URI is missing in environment variables';
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    lastError = null;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    lastError = error.message;
  }
};

const getLastError = () => lastError;

module.exports = { connectDB, getLastError };
