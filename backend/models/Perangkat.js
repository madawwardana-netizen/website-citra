const mongoose = require('mongoose');

const PerangkatSchema = new mongoose.Schema({
  pelanggan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pelanggan',
    required: true
  },
  nama_perangkat: {
    type: String,
    required: true,
    trim: true
  },
  tipe_perangkat: {
    type: String,
    enum: ['router', 'modem', 'mikrotik', 'other'],
    default: 'router'
  },
  ip_address: {
    type: String,
    trim: true
  },
  mac_address: {
    type: String,
    trim: true
  },
  serial_number: {
    type: String,
    trim: true
  },
  status_perangkat: {
    type: String,
    enum: ['aktif', 'mati', 'error'],
    default: 'aktif'
  },
  tanggal_instalasi: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'tanggal_dibuat',
    updatedAt: 'tanggal_diperbarui'
  }
});

module.exports = mongoose.model('Perangkat', PerangkatSchema);
