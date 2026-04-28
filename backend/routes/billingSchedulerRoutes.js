/**
 * Billing Routes
 * Routes untuk endpoint billing/tagihan scheduler
 */

const express = require('express');
const router = express.Router();
const BillingScheduler = require('../services/BillingScheduler');

// GET billing scheduler status
router.get('/scheduler/status', (req, res) => {
  try {
    const status = BillingScheduler.getStatus();
    res.json({
      success: true,
      message: 'Billing scheduler status',
      data: status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil status scheduler',
      error: error.message
    });
  }
});

// POST trigger manual billing check
router.post('/scheduler/check-now', async (req, res) => {
  try {
    console.log('📢 Manual billing check triggered by user');
    
    // Run async without waiting to avoid timeout
    BillingScheduler.checkManual().catch(error => {
      console.error('Error in manual billing check:', error);
    });

    res.json({
      success: true,
      message: 'Billing check sedang dijalankan di background',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering manual check:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menjalankan billing check',
      error: error.message
    });
  }
});

module.exports = router;
