# 🚀 QUICK START GUIDE - Website Citra ISP Manager

**Status**: ✅ **RUNNING ON http://localhost:5000**

---

## 📍 Quick Links

| Link | Purpose |
|------|---------|
| 🏠 [Dashboard](http://localhost:5000) | Main overview & statistics |
| 👥 [Customers](http://localhost:5000/pages/pelanggan.html) | Manage customer data |
| 📱 [Devices](http://localhost:5000/pages/perangkat.html) | WiFi equipment tracking |
| 💰 [Billing](http://localhost:5000/pages/tagihan.html) | Invoices & payments |
| 🗺️ [Map](http://localhost:5000/pages/peta.html) | Geographic visualization |
| 📅 [Schedule](http://localhost:5000/pages/jadwal-pengiriman.html) | Billing schedule |
| 🔌 [API Status](http://localhost:5000/api) | Check API endpoints |

---

## 🎯 Main Features

✅ **Customer Management** - CRUD operations for customer data  
✅ **Device Tracking** - Manage WiFi equipment per customer  
✅ **Auto Billing** - Automatic invoice generation daily at 00:00  
✅ **WhatsApp Alerts** - Send payment reminders via WhatsApp  
✅ **Map View** - See customers on interactive map  
✅ **Data Export** - Export to CSV/Excel  
✅ **Real-time Stats** - Dashboard with live metrics  

---

## 📊 Dashboard Overview

- **Total Customers**: 8 active customers
- **Total Bills**: 6 billing records
- **Unpaid Amounts**: All marked as "Belum Lunas"
- **Billing Range**: March - May 2026

---

## 💻 Technolo gies Used

| Layer | Tech |
|-------|------|
| Frontend | Bootstrap 5 + Leaflet.js + Axios |
| Backend | Node.js + Express.js |
| Database | MySQL (isp_management) |
| Auth | JWT + bcryptjs |
| Notifications | Fonnte API (WhatsApp) |

---

## 🔑 Key Customers

| Name | Phone | Package | Price |
|------|-------|---------|-------|
| nino | 088975412004 | 30 Mbps | Rp 8,000,000 |
| badrul | 088975412002 | 50 Mbps | Rp 350,000 |
| krom | 081412353109 | 100 Mbps | Rp 500,000 |
| Anto Hermawan | 082116069271 | 25 Mbps | Rp 900,000 |
| Riyan | 082116069270 | 100 Mbps | Rp 600,000 |
| Budi Santoso | 08123456789 | 40 Mbps | Rp 40,000 |
| Raka | 0864586895485 | 30 Mbps | Rp 900,000 |
| asep | 0873649327492 | 200 Mbps | Rp 800,000 |

---

## 📝 API Endpoints

```bash
# Get all customers
curl http://localhost:5000/api/pelanggan

# Get all bills
curl http://localhost:5000/api/tagihan

# Get devices
curl http://localhost:5000/api/perangkat

# Check API status
curl http://localhost:5000/api
```

---

## ⚙️ Configuration

**Environment** (.env):
- DB_HOST: 127.0.0.1
- DB_USER: root
- DB_PASSWORD: (empty)
- DB_NAME: isp_management
- PORT: 5000
- WhatsApp API: Configured with Fonnte

---

## 🛠️ Common Tasks

### Add New Customer
1. Go to [Customers](http://localhost:5000/pages/pelanggan.html)
2. Click "Tambah Pelanggan" button
3. Fill in: Name, Phone, Email, Address, Package
4. Click Save

### Create Billing
1. Go to [Billing](http://localhost:5000/pages/tagihan.html)
2. Click "Buat Tagihan Baru" button
3. Select customer & amount
4. Click Save

### View on Map
1. Go to [Map](http://localhost:5000/pages/peta.html)
2. All customer locations displayed automatically
3. Use zoom controls to navigate

### Send Reminder
1. Go to [Billing](http://localhost:5000/pages/tagihan.html)
2. Click "Test WhatsApp" button
3. Message sent to customer

### Export Data
1. Go to [Billing](http://localhost:5000/pages/tagihan.html)
2. Click "Export CSV" button
3. File downloaded automatically

---

## 🚀 Start/Stop Server

### Start Server
```bash
cd backend
npm start
```

### Stop Server
```bash
Press Ctrl+C in terminal
```

### Restart Server
```bash
# Kill port 5000
Get-NetTCPConnection -LocalPort 5000 | Stop-Process -Force

# Start again
npm start
```

---

## 📞 Support & Docs

- **Main Docs**: See `README.md`
- **Technical Details**: See `PROJECT_ANALYSIS.md`
- **Comprehensive Guide**: See `COMPREHENSIVE_ANALYSIS.md`
- **Billing Guide**: See `BILLING_SCHEDULER_GUIDE.md`
- **Project Status**: See `PROJECT_STATUS.md`

---

## ✅ Verification Checklist

- ✅ Server running on port 5000
- ✅ Database connected successfully
- ✅ 8 customers loaded
- ✅ 6 billing records loaded
- ✅ API endpoints responsive
- ✅ Frontend dashboard displaying
- ✅ Billing scheduler active
- ✅ WhatsApp service configured
- ✅ All pages accessible

---

## 🎯 Next Steps

1. **Test Features**: Explore all pages and functions
2. **Add More Customers**: Create new customer records
3. **Test Billing**: Create and manage bills
4. **Send Messages**: Test WhatsApp notifications
5. **View Map**: Check customer locations on map
6. **Export Data**: Download customer/billing data

---

## ❓ Troubleshooting

**Q: Server won't start?**  
A: Kill process on port 5000 and try again

**Q: Database not connecting?**  
A: Ensure MySQL is running and .env credentials are correct

**Q: WhatsApp not working?**  
A: Check Fonnte API key in .env and verify credits

**Q: Map not showing?**  
A: Verify Leaflet CDN is accessible

---

**Last Updated**: May 5, 2026  
**Version**: 1.0.0  
**Status**: ✅ OPERATIONAL  

*For detailed information, see COMPREHENSIVE_ANALYSIS.md*
