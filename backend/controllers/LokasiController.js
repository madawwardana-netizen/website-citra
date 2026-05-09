/**
 * Lokasi Controller
 * Controller untuk menangani request lokasi pelanggan menggunakan Mongoose
 */

const Lokasi = require('../models/Lokasi');
const Pelanggan = require('../models/Pelanggan');

class LokasiController {
  // GET all lokasi
  static async getAllLokasi(req, res) {
    try {
      const result = await Lokasi.find().populate('pelanggan_id');

      res.json({
        success: true,
        message: 'Data lokasi berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data lokasi',
        error: error.message
      });
    }
  }

  // GET lokasi by pelanggan ID
  static async getLokasiByPelangganId(req, res) {
    try {
      const { pelanggan_id } = req.params;

      const lokasi = await Lokasi.findOne({ pelanggan_id });

      res.json({
        success: true,
        message: 'Data lokasi pelanggan berhasil diambil',
        data: lokasi
      });
    } catch (error) {
      console.error('Error getting lokasi by pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data lokasi',
        error: error.message
      });
    }
  }

  // POST create lokasi
  static async createLokasi(req, res) {
    try {
      const { pelanggan_id, latitude, longitude, keterangan_lokasi } = req.body;

      const lokasi = await Lokasi.create({
        pelanggan_id,
        latitude,
        longitude,
        keterangan_lokasi: keterangan_lokasi || 'Lokasi Pelanggan'
      });

      res.status(201).json({
        success: true,
        message: 'Lokasi baru berhasil ditambahkan',
        data: lokasi
      });
    } catch (error) {
      console.error('Error creating lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menambahkan lokasi',
        error: error.message
      });
    }
  }

  // PUT update lokasi
  static async updateLokasi(req, res) {
    try {
      const { id } = req.params;
      const { latitude, longitude, keterangan_lokasi } = req.body;

      const lokasi = await Lokasi.findByIdAndUpdate(id, {
        latitude,
        longitude,
        keterangan_lokasi
      }, { new: true });

      if (!lokasi) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Lokasi berhasil diperbarui',
        data: lokasi
      });
    } catch (error) {
      console.error('Error updating lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui lokasi',
        error: error.message
      });
    }
  }

  // DELETE lokasi
  static async deleteLokasi(req, res) {
    try {
      const { id } = req.params;

      const lokasi = await Lokasi.findByIdAndDelete(id);
      if (!lokasi) {
        return res.status(404).json({
          success: false,
          message: 'Lokasi tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Lokasi berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting lokasi:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus lokasi',
        error: error.message
      });
    }
  }
}

module.exports = LokasiController;
