const mongoose = require('mongoose');

const LokasiSchema = new mongoose.Schema({
  pelanggan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pelanggan',
    required: true,
    unique: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  keterangan_lokasi: {
    type: String,
    trim: true
  }
}, {
  timestamps: {
    createdAt: 'tanggal_dibuat',
    updatedAt: false
  }
});

module.exports = mongoose.model('Lokasi', LokasiSchema);
