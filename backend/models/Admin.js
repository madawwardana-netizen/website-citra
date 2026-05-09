const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  nama_lengkap: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['aktif', 'nonaktif'],
    default: 'aktif'
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'operator'],
    default: 'operator'
  },
  tanggal_login_terakhir: {
    type: Date
  }
}, {
  timestamps: {
    createdAt: 'tanggal_dibuat',
    updatedAt: 'tanggal_diperbarui'
  }
});

// Hash password sebelum simpan
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method untuk membandingkan password
AdminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', AdminSchema);
