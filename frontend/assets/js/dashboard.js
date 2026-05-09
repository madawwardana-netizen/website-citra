/**
 * Dashboard JavaScript with Charts
 */

let chartPembayaran, chartPaket, chartRevenue;

async function loadStatistics() {
  try {
    const pelRes = await axios.get('/pelanggan/statistik');
    const tagRes = await axios.get('/tagihan/statistik');

    if (pelRes.data.success) {
      const stats = pelRes.data.data;
      document.getElementById('totalPelanggan').textContent = stats.total;
      document.getElementById('pelangganAktif').textContent = stats.aktif;
    }

    if (tagRes.data.success) {
      const tStats = tagRes.data.data;
      document.getElementById('tagihanBelum').textContent = tStats.belumLunas || 0;
      document.getElementById('totalPemasukan').textContent = formatRupiah(tStats.totalNilai || 0);
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    showNotification('Gagal memuat statistik', 'error');
  }
}

async function loadRecentTagihan() {
  try {
    const res = await axios.get('/tagihan');
    
    if (res.data.success) {
      const table = document.getElementById('tagihanTable');
      
      if (!res.data.data || res.data.data.length === 0) {
        table.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada data</td></tr>';
        return;
      }

      table.innerHTML = res.data.data.slice(0, 5).map(t => `
        <tr>
          <td>${t.nama_pelanggan}</td>
          <td>${formatRupiah(t.jumlah_tagihan)}</td>
          <td>${getStatusBadge(t.status_pembayaran)}</td>
          <td>${formatDateShort(t.bulan_tagihan)}</td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading tagihan:', error);
  }
}

async function loadCharts() {
  try {
    const tagRes = await axios.get('/tagihan');
    const pelRes = await axios.get('/pelanggan');

    if (tagRes.data.success && pelRes.data.success) {
      const tagihanData = tagRes.data.data;
      const pelangganData = pelRes.data.data;

      // Chart 1: Status Pembayaran (Pie)
      let countLunas = 0;
      let countBelumLunas = 0;
      let countCicilan = 0;

      tagihanData.forEach(t => {
        if (t.status_pembayaran === 'belum_lunas') countBelumLunas++;
        else if (t.status_pembayaran === 'cicilan') countCicilan++;
        else countLunas++;
      });

      const labels = [];
      const data = [];
      const bgColors = [];

      // Always show all 3 statuses for consistency, or hide zero values
      if (countLunas > 0) { labels.push('Lunas'); data.push(countLunas); bgColors.push('#00B368'); }
      if (countBelumLunas > 0) { labels.push('Belum Lunas'); data.push(countBelumLunas); bgColors.push('#FF6B6B'); }
      if (countCicilan > 0) { labels.push('Cicilan'); data.push(countCicilan); bgColors.push('#FFC107'); }

      // If no data at all, just show a grey placeholder
      if (data.length === 0) {
        labels.push('Belum Ada Data');
        data.push(1);
        bgColors.push('#e0e0e0');
      }

      const ctxPembayaran = document.getElementById('chartPembayaran');
      if (chartPembayaran) chartPembayaran.destroy();
      chartPembayaran = new Chart(ctxPembayaran, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: bgColors,
            borderColor: '#ffffff',
            borderWidth: 2,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { family: "'Poppins', sans-serif", size: 12 }, padding: 15 }
            }
          }
        }
      });

      // Chart 2: Paket Layanan (Bar)
      const paketCounts = {};
      pelangganData.forEach(p => {
        const paket = p.paket_layanan || 'Unknown';
        paketCounts[paket] = (paketCounts[paket] || 0) + 1;
      });

      const ctxPaket = document.getElementById('chartPaket');
      if (chartPaket) chartPaket.destroy();
      chartPaket = new Chart(ctxPaket, {
        type: 'bar',
        data: {
          labels: Object.keys(paketCounts),
          datasets: [{
            label: 'Jumlah Pelanggan',
            data: Object.values(paketCounts),
            backgroundColor: '#0066CC',
            borderColor: '#0052A3',
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { beginAtZero: true }
          }
        }
      });

      // Chart 3: Tren Tagihan (Line)
      const bulanCounts = {};
      tagihanData.forEach(t => {
        const bulan = formatDateShort(t.bulan_tagihan);
        bulanCounts[bulan] = (bulanCounts[bulan] || 0) + 1;
      });

      const ctxRevenue = document.getElementById('chartRevenue');
      if (chartRevenue) chartRevenue.destroy();
      chartRevenue = new Chart(ctxRevenue, {
        type: 'line',
        data: {
          labels: Object.keys(bulanCounts).slice(-12),
          datasets: [{
            label: 'Jumlah Tagihan',
            data: Object.values(bulanCounts).slice(-12),
            borderColor: '#0066CC',
            backgroundColor: 'rgba(0, 102, 204, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#0066CC',
            pointBorderColor: 'white',
            pointBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              labels: { font: { family: "'Poppins', sans-serif", size: 12 } }
            }
          },
          scales: {
            y: { beginAtZero: true }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading charts:', error);
  }
}

async function initDashboard() {
  await Promise.all([
    loadStatistics(),
    loadRecentTagihan(),
    loadCharts()
  ]);
  
  setInterval(() => {
    loadStatistics();
    loadRecentTagihan();
    loadCharts();
  }, 60000); // Refresh setiap 1 menit
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
