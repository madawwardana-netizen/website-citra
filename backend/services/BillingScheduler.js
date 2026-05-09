/**
 * Billing Scheduler Service
 * Service untuk auto-generate tagihan dan kirim notif WhatsApp menggunakan Mongoose
 * Berjalan setiap hari pada jam yang ditentukan
 */

const cron = require('node-cron');
const Pelanggan = require('../models/Pelanggan');
const Tagihan = require('../models/Tagihan');
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
      const pelangganList = await Pelanggan.find({ status: 'aktif' });

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
          // Cari tagihan terakhir untuk pelanggan ini
          const lastBilling = await Tagihan.findOne({ pelanggan_id: pelanggan._id })
            .sort({ bulan_tagihan: -1 });

          // Tentukan tanggal tagihan berikutnya
          const nextBillingDate = this.calculateNextBillingDate(pelanggan, lastBilling);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Jika sudah waktunya tagihan baru
          if (nextBillingDate <= today) {
            // Check if tagihan already exists for this month and year
            const alreadyExists = await Tagihan.findOne({
              pelanggan_id: pelanggan._id,
              bulan_tagihan: {
                $gte: new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth(), 1),
                $lt: new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth() + 1, 1)
              }
            });

            if (!alreadyExists) {
              // Create new tagihan
              const tagihan = await Tagihan.create({
                pelanggan_id: pelanggan._id,
                bulan_tagihan: nextBillingDate,
                jumlah_tagihan: pelanggan.harga_bulanan,
                status_pembayaran: 'belum_lunas',
                catatan: `Tagihan otomatis - ${pelanggan.paket_layanan}`
              });

              created++;
              
              // Send WhatsApp notification
              const whatsappResult = await this.sendBillingNotification(pelanggan, tagihan);
              
              if (whatsappResult.success) {
                notified++;
                console.log(`✅ ${pelanggan.nama_pelanggan}: Tagihan dibuat + WhatsApp dikirim`);
              } else {
                console.log(`⚠️  ${pelanggan.nama_pelanggan}: Tagihan dibuat tapi WhatsApp gagal`);
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
   * Calculate next billing date based on last billing or subscription start date
   */
  calculateNextBillingDate(pelanggan, lastBilling) {
    let baseDate = lastBilling ? new Date(lastBilling.bulan_tagihan) : new Date(pelanggan.tanggal_langganan);
    let nextBilling = new Date(baseDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    return nextBilling;
  }

  /**
   * Send billing notification via WhatsApp
   */
  async sendBillingNotification(pelanggan, tagihan) {
    try {
      const bulanTagihan = new Date(tagihan.bulan_tagihan);
      const bulanNama = bulanTagihan.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

      const message = `🔔 *Notifikasi Tagihan WiFi* 🔔\n\nHalo ${pelanggan.nama_pelanggan}! 👋\n\nBerikut ringkasan tagihan WiFi Anda:\n\n📦 *Paket*: ${pelanggan.paket_layanan}\n💰 *Jumlah Tagihan*: Rp${this.formatCurrency(tagihan.jumlah_tagihan)}\n📅 *Periode*: ${bulanNama}\n⏰ *Status*: Belum Dibayar\n\nMohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.\n\nTerima kasih! 🙏`;

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

  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID').format(value);
  }

  stop() {
    if (this.scheduler) {
      this.scheduler.stop();
      this.isRunning = false;
      console.log('⏹️  Billing scheduler stopped');
    }
  }

  async checkManual() {
    console.log('\n🔄 Running manual billing check...\n');
    await this.checkAndCreateBilling();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? 'Daily at 00:00' : 'Not running'
    };
  }
}

module.exports = new BillingScheduler();
