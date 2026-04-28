/**
 * Billing Schedule Service
 * Service untuk menghitung jadwal pengiriman pesan ke pelanggan
 */

const pool = require('../config/database');

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
      const query = `
        SELECT 
          p.id,
          p.nama_pelanggan,
          p.no_telepon,
          p.paket_layanan,
          p.harga_bulanan,
          p.tanggal_langganan,
          COUNT(CASE WHEN t.status_pembayaran = 'belum_lunas' THEN 1 END) as tagihan_belum_lunas
        FROM pelanggan p
        LEFT JOIN tagihan t ON p.id = t.pelanggan_id
        WHERE p.status = 'aktif'
        GROUP BY p.id
        ORDER BY p.nama_pelanggan ASC
      `;

      const [pelangganList] = await pool.query(query);

      // Calculate billing schedule for each customer
      const schedules = pelangganList.map(pelanggan => {
        const billingInfo = this.calculateNextBillingDate(pelanggan);
        
        return {
          id: pelanggan.id,
          nama_pelanggan: pelanggan.nama_pelanggan,
          no_telepon: pelanggan.no_telepon,
          paket_layanan: pelanggan.paket_layanan,
          harga_bulanan: pelanggan.harga_bulanan,
          tanggal_langganan: pelanggan.tanggal_langganan,
          tagihan_belum_lunas: pelanggan.tagihan_belum_lunas,
          next_billing_date: billingInfo.nextBillingDate,
          next_billing_formatted: billingInfo.formattedDate,
          days_until_billing: billingInfo.daysUntilBilling,
          status: billingInfo.daysUntilBilling <= 0 ? 'overdue' : 
                  billingInfo.daysUntilBilling <= 3 ? 'soon' : 'normal',
          message_preview: this.generateMessagePreview(pelanggan, billingInfo)
        };
      });

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
    
    return `🔔 *Notifikasi Tagihan WiFi* 🔔

Halo ${pelanggan.nama_pelanggan}! 👋

Berikut ringkasan tagihan WiFi Anda:

📦 *Paket*: ${pelanggan.paket_layanan}
💰 *Jumlah Tagihan*: Rp${currency}
📅 *Jatuh Tempo*: ${billingInfo.formattedDate}
⏰ *Status*: Belum Dibayar

Mohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.

Terima kasih! 🙏`;
  }

  /**
   * Get billing schedule for a specific customer
   * @param {Number} pelangganId - Customer ID
   * @returns {Object} Customer with billing schedule
   */
  static async getBillingScheduleByCustomer(pelangganId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.nama_pelanggan,
          p.no_telepon,
          p.paket_layanan,
          p.harga_bulanan,
          p.tanggal_langganan,
          COUNT(CASE WHEN t.status_pembayaran = 'belum_lunas' THEN 1 END) as tagihan_belum_lunas
        FROM pelanggan p
        LEFT JOIN tagihan t ON p.id = t.pelanggan_id
        WHERE p.id = ? AND p.status = 'aktif'
        GROUP BY p.id
      `;

      const [rows] = await pool.query(query, [pelangganId]);
      
      if (rows.length === 0) {
        return null;
      }

      const pelanggan = rows[0];
      const billingInfo = this.calculateNextBillingDate(pelanggan);

      return {
        id: pelanggan.id,
        nama_pelanggan: pelanggan.nama_pelanggan,
        no_telepon: pelanggan.no_telepon,
        paket_layanan: pelanggan.paket_layanan,
        harga_bulanan: pelanggan.harga_bulanan,
        tanggal_langganan: pelanggan.tanggal_langganan,
        tagihan_belum_lunas: pelanggan.tagihan_belum_lunas,
        next_billing_date: billingInfo.nextBillingDate,
        next_billing_formatted: billingInfo.formattedDate,
        days_until_billing: billingInfo.daysUntilBilling,
        status: billingInfo.daysUntilBilling <= 0 ? 'overdue' : 
                billingInfo.daysUntilBilling <= 3 ? 'soon' : 'normal',
        message_preview: this.generateMessagePreview(pelanggan, billingInfo)
      };
    } catch (error) {
      console.error('Error getting billing schedule:', error);
      throw error;
    }
  }
}

module.exports = BillingScheduleService;
