/**
 * Billing Schedule Service
 * Service untuk menghitung jadwal pengiriman pesan ke pelanggan menggunakan Mongoose
 */

const Pelanggan = require('../models/Pelanggan');
const Tagihan = require('../models/Tagihan');

class BillingScheduleService {
  /**
   * Calculate next billing date for a customer
   * @param {Object} pelanggan - Customer data with tanggal_langganan
   * @returns {Object} Object with next billing date and days until billing
   */
  static calculateNextBillingDate(pelanggan) {
    const today = new Date();
    const subscriptionDate = new Date(pelanggan.tanggal_langganan);
    
    // Get the day of subscription
    const subscriptionDay = subscriptionDate.getDate();
    
    // Calculate next billing date (same day of next month)
    let nextBillingDate = new Date(today.getFullYear(), today.getMonth(), subscriptionDay);
    
    // If we've already passed that day this month, move to next month
    if (nextBillingDate <= today) {
      nextBillingDate = new Date(today.getFullYear(), today.getMonth() + 1, subscriptionDay);
    }
    
    // Calculate days until billing
    const daysUntilBilling = Math.ceil((nextBillingDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      nextBillingDate,
      daysUntilBilling,
      formattedDate: nextBillingDate.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  }

  /**
   * Get billing schedule for all active customers
   * @returns {Array} Array of customers with their billing schedule
   */
  static async getAllBillingSchedules() {
    try {
      // Get all active customers
      const pelangganList = await Pelanggan.find({ status: 'aktif' }).sort({ nama_pelanggan: 1 });

      const schedules = [];
      for (const p of pelangganList) {
        // Hitung tagihan belum lunas
        const tagihanBelumLunas = await Tagihan.countDocuments({ 
          pelanggan_id: p._id, 
          status_pembayaran: 'belum_lunas' 
        });

        const billingInfo = this.calculateNextBillingDate(p);
        
        schedules.push({
          id: p._id.toString(),
          nama_pelanggan: p.nama_pelanggan,
          no_telepon: p.no_telepon,
          paket_layanan: p.paket_layanan,
          harga_bulanan: p.harga_bulanan,
          tanggal_langganan: p.tanggal_langganan,
          tagihan_belum_lunas: tagihanBelumLunas,
          next_billing_date: billingInfo.nextBillingDate,
          next_billing_formatted: billingInfo.formattedDate,
          days_until_billing: billingInfo.daysUntilBilling,
          status: billingInfo.daysUntilBilling <= 0 ? 'overdue' : 
                  billingInfo.daysUntilBilling <= 3 ? 'soon' : 'normal',
          message_preview: this.generateMessagePreview(p, billingInfo)
        });
      }

      return schedules;
    } catch (error) {
      console.error('Error getting billing schedules:', error);
      throw error;
    }
  }

  /**
   * Generate WhatsApp message preview
   * @param {Object} pelanggan - Customer data
   * @param {Object} billingInfo - Billing info
   * @returns {String} Message preview
   */
  static generateMessagePreview(pelanggan, billingInfo) {
    const currency = new Intl.NumberFormat('id-ID').format(pelanggan.harga_bulanan);
    
    return `🔔 *Notifikasi Tagihan WiFi* 🔔\n\nHalo ${pelanggan.nama_pelanggan}! 👋\n\nBerikut ringkasan tagihan WiFi Anda:\n\n📦 *Paket*: ${pelanggan.paket_layanan}\n💰 *Jumlah Tagihan*: Rp${currency}\n📅 *Jatuh Tempo*: ${billingInfo.formattedDate}\n⏰ *Status*: Belum Dibayar\n\nMohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.\n\nTerima kasih! 🙏`;
  }

  /**
   * Get billing schedule for a specific customer
   * @param {String} pelangganId - Customer ID
   * @returns {Object} Customer with billing schedule
   */
  static async getBillingScheduleByCustomer(pelangganId) {
    try {
      const p = await Pelanggan.findOne({ _id: pelangganId, status: 'aktif' });
      
      if (!p) {
        return null;
      }

      const tagihanBelumLunas = await Tagihan.countDocuments({ 
        pelanggan_id: p._id, 
        status_pembayaran: 'belum_lunas' 
      });

      const billingInfo = this.calculateNextBillingDate(p);

      return {
        id: p._id.toString(),
        nama_pelanggan: p.nama_pelanggan,
        no_telepon: p.no_telepon,
        paket_layanan: p.paket_layanan,
        harga_bulanan: p.harga_bulanan,
        tanggal_langganan: p.tanggal_langganan,
        tagihan_belum_lunas: tagihanBelumLunas,
        next_billing_date: billingInfo.nextBillingDate,
        next_billing_formatted: billingInfo.formattedDate,
        days_until_billing: billingInfo.daysUntilBilling,
        status: billingInfo.daysUntilBilling <= 0 ? 'overdue' : 
                billingInfo.daysUntilBilling <= 3 ? 'soon' : 'normal',
        message_preview: this.generateMessagePreview(p, billingInfo)
      };
    } catch (error) {
      console.error('Error getting billing schedule:', error);
      throw error;
    }
  }
}

module.exports = BillingScheduleService;
