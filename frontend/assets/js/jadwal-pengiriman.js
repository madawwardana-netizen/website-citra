/**
 * Jadwal Pengiriman Pesan - JavaScript
 */

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSchedules();
  setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Refresh button
  const btnRefresh = document.getElementById('btnRefresh');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', loadSchedules);
  }

  // Filter status
  const filterStatus = document.getElementById('filterStatus');
  if (filterStatus) {
    filterStatus.addEventListener('change', loadSchedules);
  }

  // Send all button
  const btnSendAll = document.getElementById('btnSendAll');
  if (btnSendAll) {
    btnSendAll.addEventListener('click', sendAllMessages);
  }

  // Toggle sidebar
  const toggleSidebar = document.getElementById('toggleSidebar');
  if (toggleSidebar) {
    toggleSidebar.addEventListener('click', () => {
      document.querySelector('.sidebar').classList.toggle('collapsed');
    });
  }
}

/**
 * Load billing schedules
 */
async function loadSchedules() {
  try {
    const response = await axios.get('/billing-schedule');
    const filter = document.getElementById('filterStatus').value;

    if (response.data.success && response.data.data) {
      let schedules = response.data.data;

      // Apply filter
      if (filter) {
        schedules = schedules.filter(s => s.status === filter);
      }

      const table = document.getElementById('scheduleTable');
      if (schedules.length > 0) {
        table.innerHTML = schedules.map(s => `
          <tr data-customer-id="${s.id}" data-phone="${s.no_telepon}" data-customer-name="${s.nama_pelanggan}" data-message="${encodeURIComponent(s.message_preview)}">
            <td><strong>${s.nama_pelanggan}</strong></td>
            <td>${s.no_telepon}</td>
            <td><small>${s.paket_layanan}</small></td>
            <td>${formatDate(s.tanggal_langganan)}</td>
            <td>${s.next_billing_formatted}</td>
            <td>${getStatusBadge(s.status)}</td>
            <td>
              <span class="badge ${s.days_until_billing <= 0 ? 'bg-danger' : s.days_until_billing <= 3 ? 'bg-warning' : 'bg-success'}">
                ${s.days_until_billing <= 0 ? 'OVERDUE' : s.days_until_billing + ' hari'}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-info btn-preview">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-success btn-send">
                <i class="fas fa-paper-plane"></i>
              </button>
            </td>
          </tr>
        `).join('');

        // Setup event listeners for buttons
        setupTableEventListeners();
      } else {
        table.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error loading schedules:', error);
    showNotification('Gagal memuat jadwal pengiriman', 'error');
  }
}

/**
 * Setup table event listeners
 */
function setupTableEventListeners() {
  // Preview buttons
  document.querySelectorAll('.btn-preview').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const customerId = row.dataset.customerId;
      const phone = row.dataset.phone;
      const customerName = row.dataset.customerName;
      const message = decodeURIComponent(row.dataset.message);
      
      previewMessage(customerId, customerName, phone, message);
    });
  });

  // Send buttons
  document.querySelectorAll('.btn-send').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      const customerId = row.dataset.customerId;
      const phone = row.dataset.phone;
      const customerName = row.dataset.customerName;
      const message = decodeURIComponent(row.dataset.message);
      
      previewMessage(customerId, customerName, phone, message);
    });
  });
}

/**
 * Get status badge
 */
function getStatusBadge(status) {
  const badges = {
    'overdue': '<span class="badge bg-danger">Overdue</span>',
    'soon': '<span class="badge bg-warning">Soon (3H)</span>',
    'normal': '<span class="badge bg-info">Normal</span>'
  };
  return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

/**
 * Format date
 */
function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Preview message before sending
 */
function previewMessage(customerId, customerName, phone, message) {
  document.getElementById('previewCustomer').textContent = customerName;
  document.getElementById('previewPhone').textContent = phone;
  document.getElementById('previewMessage').textContent = message;

  // Store customer ID for sending
  document.getElementById('btnSendNow').dataset.customerId = customerId;
  document.getElementById('btnSendNow').dataset.phone = phone;
  document.getElementById('btnSendNow').dataset.message = message;

  const modal = new bootstrap.Modal(document.getElementById('modalPreviewMessage'));
  modal.show();
}

/**
 * Actually send the message (from modal)
 */
document.addEventListener('DOMContentLoaded', () => {
  const btnSendNow = document.getElementById('btnSendNow');
  if (btnSendNow) {
    btnSendNow.addEventListener('click', async () => {
      try {
        const phone = btnSendNow.dataset.phone;
        const customerId = btnSendNow.dataset.customerId;

        // Get the message from modal
        const message = document.getElementById('previewMessage').textContent;

        btnSendNow.disabled = true;
        btnSendNow.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

        const response = await axios.post('/whatsapp/send', {
          phone: phone,
          message: message
        });

        if (response.data.success) {
          showNotification('✅ Pesan berhasil dikirim!', 'success');
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('modalPreviewMessage'));
          modal.hide();

          // Refresh schedules
          setTimeout(() => {
            loadSchedules();
          }, 1000);
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification(error.response?.data?.message || 'Gagal mengirim pesan', 'error');
      } finally {
        const btnSendNow = document.getElementById('btnSendNow');
        btnSendNow.disabled = false;
        btnSendNow.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Sekarang';
      }
    });
  }
});

/**
 * Send all messages
 */
async function sendAllMessages() {
  if (!confirm('Kirim pesan ke semua pelanggan yang jadwalnya sudah jatuh tempo?')) {
    return;
  }

  try {
    const btn = document.getElementById('btnSendAll');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';

    // Get all schedules
    const response = await axios.get('/billing-schedule');
    const schedules = response.data.data.filter(s => s.status === 'overdue' || s.status === 'soon');

    let sent = 0;
    let failed = 0;

    for (const schedule of schedules) {
      try {
        await axios.post('/whatsapp/send', {
          phone: schedule.no_telepon,
          message: schedule.message_preview
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send to ${schedule.nama_pelanggan}:`, error);
        failed++;
      }
    }

    showNotification(`✅ ${sent} pesan terkirim${failed > 0 ? `, ${failed} gagal` : ''}`, 'success');
    
    // Refresh
    setTimeout(() => {
      loadSchedules();
    }, 1000);
  } catch (error) {
    console.error('Error:', error);
    showNotification('Gagal mengirim pesan ke semua pelanggan', 'error');
  } finally {
    const btn = document.getElementById('btnSendAll');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Semua Sekarang';
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  try {
    const Notyf = window.Notyf || class { constructor() { this.success = this.error = this.warning = () => {}; } };
    const notyf = new Notyf();
    if (type === 'error') {
      notyf.error(message);
    } else if (type === 'warning') {
      notyf.warning(message);
    } else {
      notyf.success(message);
    }
  } catch (e) {
    console.log(message);
  }
}
