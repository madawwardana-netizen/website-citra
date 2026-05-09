/**
 * Tagihan Controller
 * Controller untuk menangani request tagihan menggunakan Mongoose
 */

const Tagihan = require('../models/Tagihan');
const Pelanggan = require('../models/Pelanggan');

class TagihanController {
  // GET all tagihan
  static async getAllTagihan(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status || null;

      const query = status ? { status_pembayaran: status } : {};

      const total = await Tagihan.countDocuments(query);
      const data = await Tagihan.find(query)
        .populate('pelanggan_id')
        .sort({ bulan_tagihan: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Mapping untuk kemiripan dengan format lama jika perlu
      const formattedData = data.map(t => {
        const obj = t.toObject();
        if (obj.pelanggan_id) {
          obj.nama_pelanggan = obj.pelanggan_id.nama_pelanggan;
          obj.no_telepon = obj.pelanggan_id.no_telepon;
        }
        return obj;
      });

      res.json({
        success: true,
        message: 'Data tagihan berhasil diambil',
        data: formattedData,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan',
        error: error.message
      });
    }
  }

  // GET tagihan belum dibayar (untuk reminder whatsapp)
  static async getTagihanBelumBayar(req, res) {
    try {
      const result = await Tagihan.find({ status_pembayaran: 'belum_lunas' }).populate('pelanggan_id');

      res.json({
        success: true,
        message: 'Data tagihan belum dibayar berhasil diambil',
        data: result
      });
    } catch (error) {
      console.error('Error getting tagihan belum bayar:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan belum dibayar',
        error: error.message
      });
    }
  }

  // GET statistik tagihan
  static async getStatistikTagihan(req, res) {
    try {
      const totalTagihan = await Tagihan.countDocuments();
      const lunasCount = await Tagihan.countDocuments({ status_pembayaran: 'lunas' });
      const belumCount = await Tagihan.countDocuments({ status_pembayaran: 'belum_lunas' });
      const cicilanCount = await Tagihan.countDocuments({ status_pembayaran: 'cicilan' });

      res.json({
        success: true,
        message: 'Statistik tagihan berhasil diambil',
        data: {
          total: totalTagihan,
          lunas: lunasCount,
          belum_lunas: belumCount,
          cicilan: cicilanCount
        }
      });
    } catch (error) {
      console.error('Error getting statistik tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik tagihan',
        error: error.message
      });
    }
  }

  // GET tagihan by pelanggan ID
  static async getTagihanByPelangganId(req, res) {
    try {
      const { pelanggan_id } = req.params;

      const tagihan = await Tagihan.find({ pelanggan_id }).sort({ bulan_tagihan: -1 });

      res.json({
        success: true,
        message: 'Data tagihan pelanggan berhasil diambil',
        data: tagihan
      });
    } catch (error) {
      console.error('Error getting tagihan by pelanggan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan pelanggan',
        error: error.message
      });
    }
  }

  // GET tagihan by ID
  static async getTagihanById(req, res) {
    try {
      const { id } = req.params;

      const tagihan = await Tagihan.findById(id).populate('pelanggan_id');
      if (!tagihan) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Data tagihan berhasil diambil',
        data: tagihan
      });
    } catch (error) {
      console.error('Error getting tagihan by id:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data tagihan',
        error: error.message
      });
    }
  }

  // POST create tagihan baru
  static async createTagihan(req, res) {
    try {
      const { pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, metode_pembayaran, catatan } = req.body;

      const tagihan = await Tagihan.create({
        pelanggan_id,
        bulan_tagihan,
        jumlah_tagihan,
        status_pembayaran: status_pembayaran || 'belum_lunas',
        metode_pembayaran,
        catatan
      });

      res.status(201).json({
        success: true,
        message: 'Tagihan baru berhasil dibuat',
        data: tagihan
      });
    } catch (error) {
      console.error('Error creating tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat tagihan baru',
        error: error.message
      });
    }
  }

  // PUT update tagihan
  static async updateTagihan(req, res) {
    try {
      const { id } = req.params;
      const { bulan_tagihan, jumlah_tagihan, status_pembayaran, tanggal_pembayaran, metode_pembayaran, catatan } = req.body;

      const tagihan = await Tagihan.findByIdAndUpdate(id, {
        bulan_tagihan,
        jumlah_tagihan,
        status_pembayaran,
        tanggal_pembayaran,
        metode_pembayaran,
        catatan
      }, { new: true });

      if (!tagihan) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tagihan berhasil diperbarui',
        data: tagihan
      });
    } catch (error) {
      console.error('Error updating tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal memperbarui tagihan',
        error: error.message
      });
    }
  }

  // DELETE tagihan
  static async deleteTagihan(req, res) {
    try {
      const { id } = req.params;

      const tagihan = await Tagihan.findByIdAndDelete(id);
      if (!tagihan) {
        return res.status(404).json({
          success: false,
          message: 'Tagihan tidak ditemukan'
        });
      }

      res.json({
        success: true,
        message: 'Tagihan berhasil dihapus'
      });
    } catch (error) {
      console.error('Error deleting tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal menghapus tagihan',
        error: error.message
      });
    }
  }
  // GET statistik tagihan untuk dashboard
  static async getStatistikTagihan(req, res) {
    try {
      const belumLunas = await Tagihan.countDocuments({ status_pembayaran: 'belum_lunas' });
      const lunasBills = await Tagihan.find({ status_pembayaran: 'lunas' });
      const totalNilai = lunasBills.reduce((acc, curr) => acc + curr.jumlah_tagihan, 0);

      res.json({
        success: true,
        message: 'Statistik tagihan berhasil diambil',
        data: {
          belumLunas,
          totalNilai
        }
      });
    } catch (error) {
      console.error('Error getting statistik tagihan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil statistik tagihan',
        error: error.message
      });
    }
  }
}

module.exports = TagihanController;
