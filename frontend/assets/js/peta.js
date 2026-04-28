/**
 * Peta (Map) JavaScript
 */

let map;

async function loadMap() {
  try {
    // Initialize Leaflet map if not already done
    if (!map) {
      map = L.map('map').setView([-6.4, 106.8], 12);
      
      // Use CartoDB tile layer sebagai alternatif (lebih stabil)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);
    } else {
      // Clear existing markers
      map.eachLayer(layer => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
    }

    // Show loading state
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    }

    // Load pelanggan locations dari endpoint yang lebih baik
    const res = await axios.get('/pelanggan/peta/coordinates');
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message || 'Gagal mengambil data lokasi');
    }

    const locations = res.data.data || [];
    
    if (locations.length === 0) {
      showNotification('Tidak ada data lokasi pelanggan', 'warning');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
      }
      return;
    }

    let markerCount = 0;
    let bounds = L.latLngBounds();
    
    locations.forEach(loc => {
      // Validasi data lokasi
      if (!loc.latitude || !loc.longitude) {
        console.warn('Lokasi tanpa koordinat:', loc);
        return;
      }

      // Validasi koordinat valid
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.warn('Koordinat tidak valid:', loc);
        return;
      }

      // Buat popup content dengan data yang aman
      const namaCustomer = loc.nama_pelanggan || 'Tidak Ada Nama';
      const keterangan = loc.keterangan_lokasi || 'Tidak Ada Keterangan';
      const noTelepon = loc.no_telepon ? `<div class="popup-info-item"><i class="fas fa-phone"></i> <span>${loc.no_telepon}</span></div>` : '';
      const alamat = loc.alamat ? `<div class="popup-info-item"><i class="fas fa-home"></i> <span>${loc.alamat}</span></div>` : '';
      const paket = loc.paket_layanan ? `<div class="popup-info-item"><i class="fas fa-wifi"></i> <span>${loc.paket_layanan}</span></div>` : '';
      
      const popupContent = `
        <div class="popup-content-customer">
          <b>${namaCustomer}</b>
          <hr>
          <small>
            <div class="popup-info-item"><i class="fas fa-location-dot"></i> <span>${keterangan}</span></div>
            ${noTelepon}
            ${alamat}
            ${paket}
          </small>
        </div>
      `;

      // Buat marker dengan custom icon
      const marker = L.marker([lat, lng], {
        title: namaCustomer
      }).bindPopup(popupContent);
      
      marker.addTo(map);
      bounds.extend([lat, lng]);
      markerCount++;
    });

    // Fit map to all markers
    if (markerCount > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (markerCount === 0) {
      showNotification('Tidak ada data lokasi dengan koordinat valid', 'warning');
    } else {
      showNotification(`${markerCount} lokasi pelanggan dimuat di peta`, 'success');
    }

    // Reset button state
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
    }

  } catch (error) {
    console.error('Error loading map:', error);
    showNotification(`Gagal memuat peta: ${error.message}`, 'error');
    
    // Reset button state
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
    }
  }
}

// Setup refresh button
document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refreshMapBtn');
  const geocodeBtn = document.getElementById('geocodeBtn');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMap();
    });
  }
  
  if (geocodeBtn) {
    geocodeBtn.addEventListener('click', () => {
      autoGeocodeAll();
    });
  }
  
  loadMap();
});

// Function to auto-geocode all pelanggan
async function autoGeocodeAll() {
  const geocodeBtn = document.getElementById('geocodeBtn');
  const statusDiv = document.getElementById('geocodeStatus');
  
  try {
    geocodeBtn.disabled = true;
    geocodeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    statusDiv.textContent = 'Sedang membuat koordinat...';

    const res = await axios.post('/pelanggan/geocode/auto-all');

    if (res.data.success) {
      showNotification(`✓ Geocoding selesai: ${res.data.geocoded} berhasil, ${res.data.failed} gagal`, 'success');
      statusDiv.textContent = `${res.data.geocoded} berhasil, ${res.data.failed} gagal`;
      
      // Reload map after geocoding
      setTimeout(() => {
        loadMap();
      }, 1500);
    } else {
      showNotification('Gagal melakukan geocoding: ' + res.data.message, 'error');
      statusDiv.textContent = 'Gagal';
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error: ' + (error.response?.data?.message || error.message), 'error');
    statusDiv.textContent = 'Error';
  } finally {
    geocodeBtn.disabled = false;
    geocodeBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> Generate Koordinat';
  }
}

// Fallback if DOM is already loaded
if (document.readyState !== 'loading') {
  const refreshBtn = document.getElementById('refreshMapBtn');
  const geocodeBtn = document.getElementById('geocodeBtn');
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMap();
    });
  }
  
  if (geocodeBtn) {
    geocodeBtn.addEventListener('click', () => {
      autoGeocodeAll();
    });
  }
  
  loadMap();
}
