/**
 * Billing Schedule Routes
 * Routes untuk endpoint jadwal pengiriman pesan
 */

const express = require('express');
const router = express.Router();
const BillingScheduleController = require('../controllers/BillingScheduleController');

// Get all billing schedules
router.get('/', BillingScheduleController.getAllSchedules);

// Get billing schedule for a specific customer
router.get('/pelanggan/:pelanggan_id', BillingScheduleController.getScheduleByCustomer);

module.exports = router;
