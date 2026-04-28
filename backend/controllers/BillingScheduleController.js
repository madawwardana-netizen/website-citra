/**
 * Billing Schedule Controller
 * Controller untuk endpoint jadwal pengiriman pesan
 */

const BillingScheduleService = require('../services/BillingScheduleService');

class BillingScheduleController {
  /**
   * Get all billing schedules
   */
  static async getAllSchedules(req, res) {
    try {
      const schedules = await BillingScheduleService.getAllBillingSchedules();

      res.json({
        success: true,
        message: 'Jadwal pengiriman pesan berhasil diambil',
        data: schedules,
        total: schedules.length
      });
    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil jadwal pengiriman',
        error: error.message
      });
    }
  }

  /**
   * Get billing schedule for a specific customer
   */
  static async getScheduleByCustomer(req, res) {
    try {
      const { pelanggan_id } = req.params;

      const schedule = await BillingScheduleService.getBillingScheduleByCustomer(pelanggan_id);

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Pelanggan tidak ditemukan atau tidak aktif'
        });
      }

      res.json({
        success: true,
        message: 'Jadwal pengiriman pesan berhasil diambil',
        data: schedule
      });
    } catch (error) {
      console.error('Error getting schedule:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil jadwal pengiriman',
        error: error.message
      });
    }
  }
}

module.exports = BillingScheduleController;
