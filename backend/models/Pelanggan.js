const mongoose = require('mongoose');

const PelangganSchema = new mongoose.Schema({
  nama_pelanggan: {
    type: String,
    required: [true, 'Nama pelanggan wajib diisi'],
    trim: true
  },
  no_telepon: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  alamat: {
    type: String,
    required: [true, 'Alamat wajib diisi']
  },
  status: {
    type: String,
    enum: ['aktif', 'nonaktif', 'suspend', 'Aktif', 'Nonaktif', 'Suspend'],
    default: 'aktif',
    lowercase: true
  },
  paket_layanan: {
    type: String
  },
  harga_bulanan: {
    type: Number
  },
  tanggal_langganan: {
    type: Date,
    required: [true, 'Tanggal langganan wajib diisi']
  }
}, {
  timestamps: {
    createdAt: 'tanggal_dibuat',
    updatedAt: 'tanggal_diperbarui'
  }
});

module.exports = mongoose.model('Pelanggan', PelangganSchema);
