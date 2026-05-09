const mongoose = require('mongoose');
const Pelanggan = require('./models/Pelanggan');
const Lokasi = require('./models/Lokasi');
const Perangkat = require('./models/Perangkat');
const Tagihan = require('./models/Tagihan');
const Admin = require('./models/Admin');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

const customers = [
  { nama_pelanggan: 'nino', no_telepon: '088975412004', email: 'nino@gmail.com', alamat: 'Jl. Raya Utama No. 1', status: 'aktif', paket_layanan: '50 Mbps', harga_bulanan: 500000, tanggal_langganan: new Date('2024-01-15') },
  { nama_pelanggan: 'Anto Hermawan', no_telepon: '082116069271', email: 'anto@gmail.com', alamat: 'Jl. Merdeka No. 5', status: 'aktif', paket_layanan: '100 Mbps', harga_bulanan: 900000, tanggal_langganan: new Date('2024-02-01') },
  { nama_pelanggan: 'danish', no_telepon: '089531735928', email: 'danish@gmail.com', alamat: 'Jl. Sudirman No. 10', status: 'aktif', paket_layanan: '100 Mbps', harga_bulanan: 1000000, tanggal_langganan: new Date('2024-01-20') },
  { nama_pelanggan: 'Riya', no_telepon: '082116069270', email: 'riya@gmail.com', alamat: 'Jl. Ahmad Yani No. 7', status: 'aktif', paket_layanan: '100 Mbps', harga_bulanan: 900000, tanggal_langganan: new Date('2024-03-01') },
  { nama_pelanggan: 'Raka', no_telepon: '086458689548', email: 'raka@gmail.com', alamat: 'Gang Melati III, RT.1/RW.11', status: 'aktif', paket_layanan: '30 Mbps', harga_bulanan: 300000, tanggal_langganan: new Date('2024-01-10') },
  { nama_pelanggan: 'Budi Santoso', no_telepon: '081234567890', email: 'budi@gmail.com', alamat: 'Jl. Gatot Subroto No. 12', status: 'aktif', paket_layanan: '50 Mbps', harga_bulanan: 500000, tanggal_langganan: new Date('2024-02-15') }
];

const locations = [
  { index: 0, latitude: -6.400000, longitude: 106.816666, keterangan_lokasi: 'Rumah Nino' },
  { index: 1, latitude: -6.410000, longitude: 106.820000, keterangan_lokasi: 'Rumah Anto' },
  { index: 2, latitude: -6.390000, longitude: 106.810000, keterangan_lokasi: 'Rumah Danish' },
  { index: 3, latitude: -6.405000, longitude: 106.815000, keterangan_lokasi: 'Rumah Riya' },
  { index: 4, latitude: -6.415000, longitude: 106.825000, keterangan_lokasi: 'Rumah Raka' },
  { index: 5, latitude: -6.395000, longitude: 106.805000, keterangan_lokasi: 'Rumah Budi' }
];

const devices = [
  { index: 0, nama_perangkat: 'TP-Link Archer C6', tipe_perangkat: 'router', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:55', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-01-15') },
  { index: 1, nama_perangkat: 'Mikrotik RB750Gr3', tipe_perangkat: 'mikrotik', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:66', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-02-01') },
  { index: 2, nama_perangkat: 'Ubiquiti UniFi', tipe_perangkat: 'router', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:77', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-01-20') },
  { index: 3, nama_perangkat: 'ASUS RT-AX88U', tipe_perangkat: 'router', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:88', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-03-01') },
  { index: 4, nama_perangkat: 'TP-Link TL-WR840N', tipe_perangkat: 'router', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:99', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-01-10') },
  { index: 5, nama_perangkat: 'Cisco Linksys EA7500', tipe_perangkat: 'router', ip_address: '192.168.1.1', mac_address: '00:11:22:33:44:AA', status_perangkat: 'aktif', tanggal_instalasi: new Date('2024-02-15') }
];

const bills = [
  { index: 0, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 500000, status_pembayaran: 'belum_lunas' },
  { index: 1, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 900000, status_pembayaran: 'lunas', tanggal_pembayaran: new Date('2026-04-05'), metode_pembayaran: 'transfer' },
  { index: 2, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 1000000, status_pembayaran: 'belum_lunas' },
  { index: 3, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 900000, status_pembayaran: 'lunas', tanggal_pembayaran: new Date('2026-04-03'), metode_pembayaran: 'cash' },
  { index: 4, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 300000, status_pembayaran: 'belum_lunas' },
  { index: 5, bulan_tagihan: new Date('2026-04-01'), jumlah_tagihan: 500000, status_pembayaran: 'cicilan', tanggal_pembayaran: new Date('2026-04-10'), metode_pembayaran: 'transfer' }
];

const admins = [
  { username: 'admin', email: 'admin@isp.local', password: 'admin123', nama_lengkap: 'Administrator', status: 'aktif', role: 'super_admin' },
  { username: 'operator', email: 'operator@isp.local', password: 'operator123', nama_lengkap: 'Operator', status: 'aktif', role: 'operator' }
];

const migrate = async () => {
  try {
    if (!MONGO_URI || MONGO_URI.includes('your_mongodb_atlas_connection_string_here')) {
      console.error('✗ Error: MONGO_URI belum dikonfigurasi di file .env');
      process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // Clear existing data
    await Pelanggan.deleteMany({});
    await Lokasi.deleteMany({});
    await Perangkat.deleteMany({});
    await Tagihan.deleteMany({});
    await Admin.deleteMany({});
    console.log('✓ Cleared existing collections');

    // Migrate Admins
    for (const adminData of admins) {
      await Admin.create(adminData);
    }
    console.log(`✓ Migrated ${admins.length} admins`);

    // Migrate Pelanggan, Lokasi, Perangkat, and Tagihan
    for (let i = 0; i < customers.length; i++) {
      const pelanggan = await Pelanggan.create(customers[i]);

      // Migrate Lokasi
      const lokasiData = locations.find(l => l.index === i);
      if (lokasiData) {
        delete lokasiData.index;
        await Lokasi.create({ ...lokasiData, pelanggan_id: pelanggan._id });
      }

      // Migrate Perangkat
      const perangkatData = devices.find(d => d.index === i);
      if (perangkatData) {
        delete perangkatData.index;
        await Perangkat.create({ ...perangkatData, pelanggan_id: pelanggan._id });
      }

      // Migrate Tagihan
      const tagihanData = bills.find(b => b.index === i);
      if (tagihanData) {
        delete tagihanData.index;
        await Tagihan.create({ ...tagihanData, pelanggan_id: pelanggan._id });
      }
    }

    console.log(`✓ Migrated ${customers.length} customers with their locations, devices, and bills`);
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
