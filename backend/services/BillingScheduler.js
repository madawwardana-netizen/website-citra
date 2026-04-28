/**
 * Billing Scheduler Service
 * Service untuk auto-generate tagihan dan kirim notif WhatsApp
 * Berjalan setiap hari pada jam yang ditentukan
 */

const cron = require('node-cron');
const pool = require('../config/database');
const WhatsAppService = require('./WhatsAppService');

class BillingScheduler {
  constructor() {
    this.whatsapp = new WhatsAppService();
    this.isRunning = false;
  }

  /**
   * Start billing scheduler
   * Runs every day at 00:00 (midnight)
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Billing scheduler sudah berjalan');
      return;
    }

    // Schedule to run every day at midnight (00:00)
    this.scheduler = cron.schedule('0 0 * * *', async () => {
      console.log('\n╔════════════════════════════════════╗');
      console.log('║  Running Automatic Billing Check   ║');
      console.log('║  ' + new Date().toLocaleString('id-ID') + '  ║');
      console.log('╚════════════════════════════════════╝\n');
      
      try {
        await this.checkAndCreateBilling();
      } catch (error) {
        console.error('❌ Error in billing scheduler:', error.message);
      }
    });

    this.isRunning = true;
    console.log('✅ Billing scheduler started (runs daily at 00:00)');

    // Run once immediately on startup for testing
    console.log('🔄 Running initial billing check...\n');
    this.checkAndCreateBilling().catch(error => {
      console.error('❌ Initial billing check error:', error.message);
    });
  }

  /**
   * Check and create billing for customers with expired periods
   */
  async checkAndCreateBilling() {
    try {
      // Get all active customers
      const query = `
        SELECT 
          p.id,
          p.nama_pelanggan,
          p.no_telepon,
          p.email,
          p.harga_bulanan,
          p.paket_layanan,
          p.tanggal_langganan,
          MAX(t.bulan_tagihan) as last_billing_date
        FROM pelanggan p
        LEFT JOIN tagihan t ON p.id = t.pelanggan_id
        WHERE p.status = 'aktif'
        GROUP BY p.id
      `;

      const [pelangganList] = await pool.execute(query);

      if (!pelangganList || pelangganList.length === 0) {
        console.log('✓ Tidak ada pelanggan aktif');
        return;
      }

      console.log(`📊 Mengecek ${pelangganList.length} pelanggan aktif...\n`);

      let created = 0;
      let notified = 0;
      let failed = 0;

      for (const pelanggan of pelangganList) {
        try {
          // Get next billing date
          const nextBillingDate = this.getNextBillingDate(pelanggan);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check if billing date has passed (overdue)
          if (nextBillingDate <= today) {
            // Check if tagihan already exists for this month
            const checkQuery = `
              SELECT id FROM tagihan 
              WHERE pelanggan_id = ? 
              AND YEAR(bulan_tagihan) = ? 
              AND MONTH(bulan_tagihan) = ?
            `;

            const [existing] = await pool.execute(checkQuery, [
              pelanggan.id,
              nextBillingDate.getFullYear(),
              nextBillingDate.getMonth() + 1
            ]);

            if (existing.length === 0) {
              // Create new tagihan
              const tagihanResult = await this.createTagihan(pelanggan, nextBillingDate);
              
              if (tagihanResult.success) {
                created++;
                
                // Send WhatsApp notification
                const whatsappResult = await this.sendBillingNotification(pelanggan, tagihanResult.tagihan);
                
                if (whatsappResult.success) {
                  notified++;
                  console.log(`✅ ${pelanggan.nama_pelanggan}: Tagihan dibuat + WhatsApp dikirim`);
                } else {
                  console.log(`⚠️  ${pelanggan.nama_pelanggan}: Tagihan dibuat tapi WhatsApp gagal`);
                }
              }
            } else {
              console.log(`ℹ️  ${pelanggan.nama_pelanggan}: Tagihan sudah ada untuk bulan ini`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing ${pelanggan.nama_pelanggan}:`, error.message);
          failed++;
        }
      }

      console.log('\n╔════════════════════════════════════╗');
      console.log('║  Billing Check Complete           ║');
      console.log(`║  Dibuat: ${created} | Notif: ${notified} | Error: ${failed}     ║`);
      console.log('╚════════════════════════════════════╝\n');

    } catch (error) {
      console.error('Error in checkAndCreateBilling:', error);
    }
  }

  /**
   * Calculate next billing date based on subscription start date
   * @param {object} pelanggan - Customer data
   * @returns {Date} - Next billing date
   */
  getNextBillingDate(pelanggan) {
    // If no last billing, use subscription start date
    let lastBillingDate = pelanggan.last_billing_date 
      ? new Date(pelanggan.last_billing_date)
      : new Date(pelanggan.tanggal_langganan);

    // Add 1 month to get next billing date
    let nextBilling = new Date(lastBillingDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    return nextBilling;
  }

  /**
   * Create new tagihan record
   * @param {object} pelanggan - Customer data
   * @param {Date} billingDate - Billing date
   * @returns {object} - Result object
   */
  async createTagihan(pelanggan, billingDate) {
    try {
      const insertQuery = `
        INSERT INTO tagihan 
        (pelanggan_id, bulan_tagihan, jumlah_tagihan, status_pembayaran, catatan) 
        VALUES (?, ?, ?, ?, ?)
      `;

      const catatan = `Tagihan otomatis - ${pelanggan.paket_layanan}`;

      const [result] = await pool.execute(insertQuery, [
        pelanggan.id,
        billingDate,
        pelanggan.harga_bulanan,
        'belum_lunas',
        catatan
      ]);

      return {
        success: true,
        tagihan: {
          id: result.insertId,
          bulan_tagihan: billingDate,
          jumlah_tagihan: pelanggan.harga_bulanan,
          status_pembayaran: 'belum_lunas'
        }
      };
    } catch (error) {
      console.error('Error creating tagihan:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send billing notification via WhatsApp
   * @param {object} pelanggan - Customer data
   * @param {object} tagihan - Billing data
   * @returns {object} - Result object
   */
  async sendBillingNotification(pelanggan, tagihan) {
    try {
      const bulanTagihan = new Date(tagihan.bulan_tagihan);
      const bulanNama = bulanTagihan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const message = `🔔 *Notifikasi Tagihan WiFi* 🔔

Halo ${pelanggan.nama_pelanggan}! 👋

Berikut ringkasan tagihan WiFi Anda:

📦 *Paket*: ${pelanggan.paket_layanan}
💰 *Jumlah Tagihan*: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}
📅 *Periode*: ${bulanNama}
⏰ *Status*: Belum Dibayar

Mohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.

Terima kasih! 🙏`;

      const result = await this.whatsapp.sendMessage(pelanggan.no_telepon, message);

      return {
        success: result.success,
        message: result.success ? 'WhatsApp sent successfully' : result.error
      };
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format currency to Indonesian Rupiah
   * @param {number} value - Amount
   * @returns {string} - Formatted currency
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.scheduler) {
      this.scheduler.stop();
      this.isRunning = false;
      console.log('⏹️  Billing scheduler stopped');
    }
  }

  /**
   * Check billing manually (for testing/manual trigger)
   */
  async checkManual() {
    console.log('\n🔄 Running manual billing check...\n');
    await this.checkAndCreateBilling();
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 'Daily at 00:00' : 'Not running'
    };
  }
}

// Export as singleton instance
module.exports = new BillingScheduler();
