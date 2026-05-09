const mongoose = require('mongoose');

const TagihanSchema = new mongoose.Schema({
  pelanggan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pelanggan',
    required: true
  },
  bulan_tagihan: {
    type: Date,
    required: true
  },
  jumlah_tagihan: {
    type: Number,
    required: true
  },
  status_pembayaran: {
    type: String,
    enum: ['lunas', 'belum_lunas', 'cicilan'],
    default: 'belum_lunas'
  },
  tanggal_pembayaran: {
    type: Date
  },
  metode_pembayaran: {
    type: String,
    trim: true
  },
  catatan: {
    type: String,
    trim: true
  }
}, {
  timestamps: {
    createdAt: 'tanggal_dibuat',
    updatedAt: 'tanggal_diperbarui'
  }
});

module.exports = mongoose.model('Tagihan', TagihanSchema);
