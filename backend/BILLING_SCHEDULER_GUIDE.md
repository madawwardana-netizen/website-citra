# 📋 Sistem Auto Billing & WhatsApp Notification

## 🎯 Fitur Utama

Sistem otomatis yang akan:
1. ✅ **Mengecek expired subscriptions** setiap pelanggan aktif
2. ✅ **Membuat tagihan otomatis** ketika periode telah habis
3. ✅ **Mengirim notifikasi WhatsApp** ke pelanggan tentang tagihan baru
4. ✅ **Dapat di-trigger manual** kapan saja dari UI

---

## 🔧 Cara Kerja

### Alur Otomatis (Setiap Hari Jam 00:00)

```
[Scheduler Cron] → [Cek Pelanggan Aktif]
    ↓
[Tentukan Next Billing Date] → [Cek Apakah Sudah Lewat?]
    ↓
[Buat Tagihan Baru (belum_lunas)] → [Kirim WhatsApp]
    ↓
[Log Report]
```

### Kalkulasi Next Billing Date

```
1. Ambil last_billing_date dari database
   - Jika belum ada: gunakan tanggal_langganan (tgl subscribe)
   
2. Tambah 1 bulan
   - Contoh: Langganan 15 Jan → Tagihan 15 Feb, 15 Mar, dst
   
3. Jika tanggal pembayaran > hari ini:
   - Status: "Belum waktunya" → Skip
   
4. Jika tanggal pembayaran ≤ hari ini:
   - Status: "Sudah lewat" → Buat tagihan + Kirim WhatsApp
```

---

## 📊 Contoh Database Structure

### Tabel: `pelanggan`
```sql
id: 1
nama_pelanggan: "Andi"
no_telepon: "0812-1234-5678"
harga_bulanan: 500000
tanggal_langganan: "2024-01-15"
status: "aktif"
```

### Tabel: `tagihan`
```sql
id: 1
pelanggan_id: 1
bulan_tagihan: "2024-02-15"  ← Setiap bulan auto-created
jumlah_tagihan: 500000
status_pembayaran: "belum_lunas"
catatan: "Tagihan otomatis - 50 Mbps"
```

---

## 🚀 Backend Implementation

### File Baru / Diubah:

1. **`services/BillingScheduler.js`** (BARU)
   - Implementasi scheduler menggunakan `node-cron`
   - Fungsi: `checkAndCreateBilling()`
   - Fungsi: `sendBillingNotification()`

2. **`routes/billingSchedulerRoutes.js`** (BARU)
   - `GET /api/billing/scheduler/status` → Status scheduler
   - `POST /api/billing/scheduler/check-now` → Trigger manual

3. **`server.js`** (DIUBAH)
   - Import `BillingScheduler`
   - Start scheduler saat server berjalan

4. **`package.json`** (DIUBAH)
   - Tambah: `"node-cron": "^3.x.x"`

---

## 💬 WhatsApp Message Template

Pesan yang dikirim ke pelanggan:

```
🔔 *Notifikasi Tagihan WiFi* 🔔

Halo Andi! 👋

Berikut ringkasan tagihan WiFi Anda:

📦 *Paket*: 50 Mbps
💰 *Jumlah Tagihan*: Rp500.000
📅 *Periode*: Februari 2024
⏰ *Status*: Belum Dibayar

Mohon segera lakukan pembayaran untuk menjaga kelancaran layanan Anda.

Terima kasih! 🙏
```

---

## 🎮 Cara Menggunakan dari Frontend

### 1. **Otomatis** (Setiap Hari Jam 00:00)
- Sistem berjalan otomatis di background
- Lihat status di halaman Tagihan
- Green ✅ = Scheduler aktif dan berjalan

### 2. **Manual Trigger** (Kapan Saja)
```
Di halaman Tagihan → Klik "Check Billing Sekarang"
  ↓
Status akan update (Processing...)
  ↓
Setelah selesai, list tagihan akan refresh otomatis
```

### 3. **Monitor Hasil**
- Lihat di tabel tagihan baru yang dibuat
- Cek di terminal/logs sistem untuk detail

---

## ⚙️ API Endpoints

### 1. Get Scheduler Status
```bash
GET /api/billing/scheduler/status

Response:
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextRun": "Daily at 00:00"
  }
}
```

### 2. Trigger Manual Check
```bash
POST /api/billing/scheduler/check-now

Response:
{
  "success": true,
  "message": "Billing check sedang dijalankan di background",
  "timestamp": "2024-02-15T12:00:00Z"
}
```

### 3. Get All Tagihan
```bash
GET /api/tagihan?page=1&limit=20&status=belum_lunas

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_pelanggan": "Andi",
      "no_telepon": "0812-1234-5678",
      "jumlah_tagihan": 500000,
      "status_pembayaran": "belum_lunas",
      "bulan_tagihan": "2024-02-15"
    }
  ]
}
```

---

## 🛠️ Konfigurasi

### Environment Variables (.env)

```env
# WhatsApp API (Fonnte)
WHATSAPP_API_KEY=your_fonnte_api_key
WHATSAPP_API_URL=https://api.fonnte.com/send

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=isp_management

# Server
PORT=5000
```

### Scheduler Schedule

File: `services/BillingScheduler.js`
```javascript
// Setiap hari jam 00:00 (Midnight)
this.scheduler = cron.schedule('0 0 * * *', async () => {
  // Run billing check
});

// Format Cron: minute hour day-of-month month day-of-week
// 0 0 * * * = Setiap hari jam 00:00
// 0 8 * * * = Setiap hari jam 08:00
// 0 */6 * * * = Setiap 6 jam
```

---

## 📈 Fitur Tambahan yang Bisa Ditambahkan

### 1. **Reminder H-3** (3 hari sebelum jatuh tempo)
```javascript
// Kirim reminder jika bulan_tagihan - 3 hari == hari ini
// Message: "Perhatian, tagihan akan jatuh tempo dalam 3 hari"
```

### 2. **Suspension Warning** (Jika tagihan > 30 hari belum dibayar)
```javascript
// Jika status_pembayaran = belum_lunas && 30 hari lewat
// Kirim warning: "Layanan akan diputus jika tidak dibayar"
// Update status: suspend
```

### 3. **Payment Confirmation**
```javascript
// Saat staff mengubah status_pembayaran = lunas
// Kirim konfirmasi: "Terima kasih, pembayaran Anda sudah diterima"
```

### 4. **Dashboard Widget**
```
┌─────────────────────────┐
│ Tagihan Bulan Ini       │
├─────────────────────────┤
│ Total: Rp15.000.000     │
│ Lunas: Rp8.000.000      │
│ Belum: Rp7.000.000      │
└─────────────────────────┘
```

---

## 🐛 Troubleshooting

### Scheduler Tidak Berjalan?
1. Restart server
2. Cek console log: `✅ Billing scheduler started`
3. Pastikan database terkoneksi

### WhatsApp Tidak Terkirim?
1. Cek `.env` - WHATSAPP_API_KEY valid?
2. Cek no_telepon pelanggan - format benar? (misal: 62812...)
3. Cek internet connection
4. Lihat error log di console

### Tagihan Tidak Dibuat?
1. Cek apakah pelanggan status = "aktif"
2. Cek tanggal_langganan dan last_billing_date
3. Test manual dengan "Check Billing Sekarang"

---

## 📝 Test Case

### Scenario 1: Buat Tagihan Pertama
```
1. Pelanggan baru: Andi (Langganan 15 Jan 2024)
2. Setara hari ini: 15 Feb 2024
3. System check: 15 Feb <= hari ini? YES
4. Action: Buat tagihan Feb, Kirim WhatsApp
```

### Scenario 2: Sudah Ada Tagihan Bulan Ini
```
1. Pelanggan: Andi
2. Last tagihan: 15 Feb 2024 (sudah dibuat)
3. System check: Tagihan Feb sudah ada? YES
4. Action: Skip (tidak duplikat)
```

### Scenario 3: Manual Trigger
```
1. Klik "Check Billing Sekarang" di halaman Tagihan
2. API: POST /api/billing/scheduler/check-now
3. Response: "Billing check sedang dijalankan..."
4. Background: Proses berjalan
5. UI: Otomatis refresh hasil dalam 2-3 detik
```

---

## 📞 Support

Jika ada pertanyaan atau error:
1. Cek logs di terminal
2. Cek `.env` configuration
3. Pastikan WhatsApp API active
4. Reset database jika perlu

---

**Selesai! Sistem auto billing Anda siap digunakan. 🎉**
