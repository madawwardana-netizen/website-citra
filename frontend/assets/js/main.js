/**
 * Main JavaScript - Utility Functions & API Setup
 */

// Notyf Notification
const notyf = new Notyf({
  duration: 4000,
  position: { x: 'right', y: 'bottom' }
});

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Sidebar Toggle - Desktop and Mobile
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');
const wrapper = document.querySelector('.wrapper');

if (toggleSidebarBtn && sidebar) {
  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
    
    const isNowCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar-collapsed', isNowCollapsed);
    
    if (isNowCollapsed) {
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.classList.remove('sidebar-collapsed');
    }
  });
  
  // Restore sidebar state from localStorage
  const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
  if (isCollapsed) {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');
    document.documentElement.classList.add('sidebar-collapsed');
  } else {
    document.documentElement.classList.remove('sidebar-collapsed');
  }
}

// Close sidebar when clicking outside (mobile)
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    if (!e.target.closest('.sidebar') && !e.target.closest('.btn-toggle-sidebar')) {
      sidebar?.classList.remove('active');
    }
  }
});

// ===== UTILITY FUNCTIONS =====

function showNotification(message, type = 'success') {
  switch(type) {
    case 'success':
      notyf.success(message);
      break;
    case 'error':
      notyf.error(message);
      break;
    case 'warning':
      notyf.open({ type: 'warning', message: message });
      break;
    case 'info':
      notyf.open({ type: 'info', message: message });
      break;
    default:
      notyf.success(message);
  }
}

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(value);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(date));
}

function getStatusBadge(status) {
  const badges = {
    'aktif': '<span class="badge bg-success">Aktif</span>',
    'nonaktif': '<span class="badge bg-secondary">Nonaktif</span>',
    'suspend': '<span class="badge bg-danger">Suspend</span>',
    'lunas': '<span class="badge bg-success">Lunas</span>',
    'belum_lunas': '<span class="badge bg-warning">Belum Lunas</span>',
    'cicilan': '<span class="badge bg-info">Cicilan</span>',
    'mati': '<span class="badge bg-danger">Mati</span>',
    'error': '<span class="badge bg-danger">Error</span>'
  };
  return badges[status] || status;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Citra NET Manager loaded');
});
