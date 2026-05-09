/**
 * Database Connection Configuration
 * File ini mengatur koneksi ke MongoDB menggunakan Mongoose
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    if (!MONGO_URI || MONGO_URI.includes('your_mongodb_atlas_connection_string_here')) {
      throw new Error('MONGO_URI belum dikonfigurasi di file .env');
    }

    const conn = await mongoose.connect(MONGO_URI);
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`✗ Error koneksi MongoDB: ${error.message}`);
    // Jangan exit process jika hanya gagal koneksi awal, biarkan server berjalan
    // tapi log error dengan jelas.
  }
};

module.exports = connectDB;
