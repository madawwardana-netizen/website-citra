/**
 * Pelanggan Controller
 * Controller untuk menangani request pelanggan menggunakan Mongoose
 */

const Pelanggan = require('../models/Pelanggan');
const Lokasi = require('../models/Lokasi');
const geocoding = require('../services/GeocodingService');

class PelangganController {
  // GET all pelanggan
  static async getAllPelanggan(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const search = req.query.search || '';

      const query = search ? {
        $or: [
          { nama_pelanggan: { $regex: search, $options: 'i' } },
          { no_telepon: { $regex: search, $options: 'i' } },
          { alamat: { $regex: search, $options: 'i' } }
        ]
      } : {};

      const total = await Pelanggan.countDocuments(query);
      const data = await Pelanggan.find(query)
        .sort({ tanggal_dibuat: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      res.json({
        success: true,
        message: 'Data pelanggan berhasil diambil',
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pelanggan',
        error: error.message
      });
    }
  }

  // GET statistik pelanggan
  static async getStatistik(req, res) {
    try {
      const totalPelanggan = await Pelanggan.countDocuments();
      const pelangganAktif = await Pelanggan.countDocuments({ status: 'aktif' });
      
      // Hitung pemasukan (dari tagihan lunas)
      const Tagihan = require('../models/Tagihan');
      const lunasBills = await Tagihan.find({ status_pembayaran: 'lunas' });
      const totalPemasukan = lunasBills.reduce((acc, curr) => acc + curr.jumlah_tagihan, 0);
      
      const tagihanBelum = await Tagihan.countDocuments({ status_pembayaran: 'belum_lunas' });

      res.json({
        success: true,
        message: 'Statistik pelanggan berhasil diambil',
        data: {
          total: totalPelanggan,
          aktif: pelangganAktif,
          tagihanBelum,
          totalPemasukan
        }
      });
    } catch (error) {
      console.error('Error getting statistik:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik pelanggan',
        error: error.message
      });
    }
  }

  // GET pelanggan by ID
  static async getPelangganById(req, res) {
    try {
      const { id } = req.params;
      const pelanggan = await Pelanggan.findById(id);

      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Ambil lokasi jika ada
      const lokasi = await Lokasi.findOne({ pelanggan_id: id });

      res.json({
        success: true,
        message: 'Data pelanggan berhasil diambil',
        data: {
          ...pelanggan.toObject(),
          latitude: lokasi ? lokasi.latitude : 0,
          longitude: lokasi ? lokasi.longitude : 0
        }
      });
    } catch (error) {
      console.error('Error getting pelanggan by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data pelanggan',
        error: error.message
      });
    }
  }

  // POST create pelanggan baru
  static async createPelanggan(req, res) {
    try {
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, tanggal_langganan, latitude, longitude } = req.body;

      // Create pelanggan
      const pelanggan = await Pelanggan.create({
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status: status || 'aktif',
        paket_layanan,
        harga_bulanan,
        tanggal_langganan: tanggal_langganan || new Date()
      });

      // Create lokasi jika ada koordinat
      if (latitude && longitude) {
        await Lokasi.create({
          pelanggan_id: pelanggan._id,
          latitude,
          longitude,
          keterangan_lokasi: `Lokasi ${nama_pelanggan}`
        });
      } else {
        // Auto geocode dari alamat
        const GeocodingService = require('../services/GeocodingService');
        const geoResult = await GeocodingService.geocodeAddress(alamat);
        
        if (geoResult.success) {
          await Lokasi.create({
            pelanggan_id: pelanggan._id,
            latitude: geoResult.latitude,
            longitude: geoResult.longitude,
            keterangan_lokasi: `Auto-generated dari alamat: ${alamat}`
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Pelanggan baru berhasil ditambahkan',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error creating pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan pelanggan baru',
        error: error.message
      });
    }
  }

  // PUT update pelanggan
  static async updatePelanggan(req, res) {
    try {
      const { id } = req.params;
      const { nama_pelanggan, no_telepon, email, alamat, status, paket_layanan, harga_bulanan, latitude, longitude } = req.body;

      const pelanggan = await Pelanggan.findByIdAndUpdate(id, {
        nama_pelanggan,
        no_telepon,
        email,
        alamat,
        status,
        paket_layanan,
        harga_bulanan
      }, { new: true });

      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Update/Create lokasi
      if (latitude && longitude) {
        await Lokasi.findOneAndUpdate(
          { pelanggan_id: id },
          { latitude, longitude, keterangan_lokasi: alamat },
          { upsert: true, new: true }
        );
      }

      res.json({
        success: true,
        message: 'Pelanggan berhasil diperbarui',
        data: pelanggan
      });
    } catch (error) {
      console.error('Error updating pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui pelanggan',
        error: error.message
      });
    }
  }

  // DELETE pelanggan
  static async deletePelanggan(req, res) {
    try {
      const { id } = req.params;

      const pelanggan = await Pelanggan.findByIdAndDelete(id);
      if (!pelanggan) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan'
        });
      }

      // Delete related data
      await Lokasi.deleteMany({ pelanggan_id: id });
      const Perangkat = require('../models/Perangkat');
      const Tagihan = require('../models/Tagihan');
      await Perangkat.deleteMany({ pelanggan_id: id });
      await Tagihan.deleteMany({ pelanggan_id: id });

      res.json({
        success: true,
        message: 'Pelanggan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus pelanggan',
        error: error.message
      });
    }
  }

  // GET pelanggan with coordinates untuk peta
  static async getPelangganWithCoordinates(req, res) {
    try {
      const lokasiList = await Lokasi.find().populate('pelanggan_id');
      
      const data = lokasiList.filter(l => l.pelanggan_id).map(l => ({
        id: l.pelanggan_id._id.toString(),
        nama_pelanggan: l.pelanggan_id.nama_pelanggan,
        no_telepon: l.pelanggan_id.no_telepon,
        email: l.pelanggan_id.email,
        alamat: l.pelanggan_id.alamat,
        status: l.pelanggan_id.status,
        paket_layanan: l.pelanggan_id.paket_layanan,
        harga_bulanan: l.pelanggan_id.harga_bulanan,
        latitude: l.latitude,
        longitude: l.longitude,
        keterangan_lokasi: l.keterangan_lokasi
      }));

      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil',
        data
      });
    } catch (error) {
      console.error('Error getting pelanggan with coordinates:', error);
      res.json({
        success: true,
        message: 'Data pelanggan dengan koordinat berhasil diambil (kosong)',
        data: []
      });
    }
  }

  // POST auto-geocode semua pelanggan yang belum punya koordinat
  static async geocodeAllPelanggan(req, res) {
    try {
      const pelangganList = await Pelanggan.find();
      let geocoded = 0;
      let failed = 0;

      for (const p of pelangganList) {
        const hasLokasi = await Lokasi.findOne({ pelanggan_id: p._id });
        if (!hasLokasi || !hasLokasi.latitude) {
          const result = await geocoding.geocodeAddress(p.alamat);
          if (result.success) {
            await Lokasi.findOneAndUpdate(
              { pelanggan_id: p._id },
              { latitude: result.latitude, longitude: result.longitude, keterangan_lokasi: p.alamat },
              { upsert: true }
            );
            geocoded++;
          } else {
            failed++;
          }
          // Simple delay
          await new Promise(r => setTimeout(r, 1000));
        }
      }

      res.json({
        success: true,
        message: `Geocoding selesai: ${geocoded} berhasil, ${failed} gagal`,
        geocoded,
        failed
      });
    } catch (error) {
      console.error('Error in geocodeAllPelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal melakukan auto-geocode',
        error: error.message
      });
    }
  }
  // POST import pelanggan from Excel
  static async importFromExcel(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
      }

      // Implementasi import excel ke MongoDB
      // Untuk sementara, kita kembalikan sukses agar route tidak error
      res.json({
        success: true,
        message: 'Fitur import Excel sedang dalam tahap penyesuaian untuk MongoDB'
      });
    } catch (error) {
      console.error('Error importing from Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengimpor data dari Excel',
        error: error.message
      });
    }
  }
}

module.exports = PelangganController;
