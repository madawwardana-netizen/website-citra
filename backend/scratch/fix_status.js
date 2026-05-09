const mongoose = require('mongoose');
require('dotenv').config();
const Pelanggan = require('../models/Pelanggan');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Update any status that is empty, null or capitalized to 'aktif'
    const result = await Pelanggan.updateMany(
      { status: { $in: ['', null, 'Aktif', 'Aktif ', 'aktif '] } },
      { $set: { status: 'aktif' } }
    );
    
    console.log(`Updated ${result.modifiedCount} customers to "aktif"`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
