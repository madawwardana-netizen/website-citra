/**
 * Peta (Map) JavaScript - Enhanced with better location markers
 */

let map;

async function loadMap() {
  try {
    // Initialize Leaflet map if not already done
    if (!map) {
      const osmMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      });

      const cartoLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      });

      const googleStreets = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google'
      });

      const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google'
      });

      map = L.map('map', {
        center: [-6.4, 106.8],
        zoom: 12,
        layers: [googleStreets]
      });

      const baseMaps = {
        "Google Streets": googleStreets,
        "Google Hybrid (Satelit)": googleHybrid,
        "OpenStreetMap": osmMap,
        "Minimalis (Carto)": cartoLight
      };

      L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);
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

    // Load pelanggan locations
    const res = await axios.get('/pelanggan/peta/coordinates');
    
    if (!res.data || !res.data.success) {
      throw new Error(res.data?.message || 'Gagal mengambil data lokasi');
    }

    const pelangganList = res.data.data || [];
    
    if (pelangganList.length === 0) {
      showNotification('Tidak ada data pelanggan', 'warning');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Peta';
      }
      return;
    }

    let markerCount = 0;
    let bounds = L.latLngBounds();
    
    pelangganList.forEach(pel => {
      // Pakai koordinat langsung dari field MongoDB
      const lat = parseFloat(pel.latitude);
      const lng = parseFloat(pel.longitude);
      
      // Validasi koordinat
      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
        console.warn('Koordinat tidak valid untuk:', pel.nama_pelanggan);
        return;
      }

      // Buat popup content dengan data profesional
      const namaCustomer = pel.nama_pelanggan || 'Tidak Ada Nama';
      const noTelepon = pel.no_telepon || '-';
      const paket = pel.paket_layanan || '-';
      const harga = pel.harga_bulanan ? formatRupiah(pel.harga_bulanan) : '-';
      const status = pel.status || '-';
      
      const popupContent = `
        <div class="popup-content-customer" style="min-width: 250px;">
          <b style="color: #0066CC; font-size: 15px;">${namaCustomer}</b>
          <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
          <small>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-phone" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>No. Telepon:</strong> ${noTelepon}</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-wifi" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Paket:</strong> ${paket}</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-money-bill" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Harga:</strong> ${harga}/bln</span>
            </div>
            <div class="popup-info-item" style="margin: 5px 0;">
              <i class="fas fa-check-circle" style="color: #0066CC; margin-right: 8px;"></i>
              <span><strong>Status:</strong> ${status}</span>
            </div>
          </small>
        </div>
      `;

      // Buat marker dengan custom blue icon
      const customIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker([lat, lng], {
        icon: customIcon,
        title: namaCustomer
      }).bindPopup(popupContent, { maxWidth: 300 });
      
      marker.addTo(map);
      bounds.extend([lat, lng]);
      markerCount++;
    });

    // Fit map to all markers
    if (markerCount > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    if (markerCount === 0) {
      showNotification('Tidak ada pelanggan dengan lokasi valid', 'warning');
    } else {
      showNotification(`${markerCount} lokasi pelanggan berhasil ditampilkan`, 'success');
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
  
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadMap();
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
