# Implementasi Statistik Penjualan Dashboard

## Overview
Implementasi ini menambahkan fitur statistik penjualan yang komprehensif ke dashboard, menampilkan data real-time dari sales order dengan berbagai metrik performa.

## Fitur yang Ditambahkan

### 1. Backend API Endpoint
**File:** `adn-be/app/controllers/sales_controller.ts`

#### Method: `getSalesStatistics()`
Endpoint baru yang mengembalikan:
- Total nominal transaksi 1 bulan terakhir
- Total nominal transaksi 2 bulan lalu (untuk perbandingan)
- Data per minggu (4 minggu terakhir)
- Performa penjualan (persentase perubahan)
- Data hari ini
- Data minggu ini dan minggu lalu

**Route:** `GET /api/sales-order/statistics`

### 2. Frontend Store
**File:** `nuxt-erp/stores/sales-statistics.ts`

Store Pinia yang mengelola:
- State untuk data statistik
- Getters untuk formatting data (currency, percentage)
- Actions untuk fetch dan refresh data
- Error handling dan loading states

### 3. Dashboard Components

#### Card Report Penjualan (Updated)
- Menampilkan total transaksi 1 bulan terakhir
- Performa mingguan dengan indikator warna
- Total penjualan hari ini
- Performa bulanan dengan perbandingan

#### Card Data Mingguan (New)
- Daftar 4 minggu terakhir dengan detail tanggal
- Total penjualan per minggu
- Format currency Indonesia

#### Card Ringkasan (Updated)
- Total Revenue Bulanan dengan performa
- Total Sales Minggu Ini dengan perbandingan
- Total Sales Hari Ini (real-time)
- Ringkasan Mingguan dengan trend

## Struktur Data API Response

```json
{
  "lastMonth": {
    "total": 15000000,
    "performance": 12.5
  },
  "thisWeek": {
    "total": 3500000,
    "performance": -5.2
  },
  "today": {
    "total": 500000
  },
  "weeklyData": [
    {
      "week": "Week 1",
      "amount": 2000000,
      "dateRange": "01/01 - 07/01"
    },
    {
      "week": "Week 2", 
      "amount": 2500000,
      "dateRange": "08/01 - 14/01"
    }
  ],
  "performance": {
    "monthly": 12.5,
    "weekly": -5.2
  }
}
```

## Fitur Utama

### 1. Real-time Data
- Data diambil dari database sales order dengan status 'delivered'
- Auto-refresh saat halaman dimuat
- Manual refresh melalui tombol

### 2. Formatting
- Currency formatting dalam Rupiah
- Percentage formatting dengan tanda +/- 
- Color coding untuk performa (hijau = positif, merah = negatif)

### 3. Responsive Design
- Card layout yang responsif
- Loading states dan error handling
- Dropdown menu untuk aksi tambahan

### 4. Performance Metrics
- Perbandingan bulanan (bulan ini vs bulan lalu)
- Perbandingan mingguan (minggu ini vs minggu lalu)
- Trend analysis dengan visual indicators

## Cara Penggunaan

### 1. Mengakses Data
```javascript
// Di component Vue
import { useSalesStatisticsStore } from '~/stores/sales-statistics'

const salesStatisticsStore = useSalesStatisticsStore()

// Fetch data
await salesStatisticsStore.fetchSalesStatistics()

// Access formatted data
console.log(salesStatisticsStore.formattedLastMonthTotal)
console.log(salesStatisticsStore.formattedLastMonthPerformance)
```

### 2. Refresh Data
```javascript
// Manual refresh
await salesStatisticsStore.refreshStatistics()
```

### 3. Error Handling
```javascript
// Check loading state
if (salesStatisticsStore.loading) {
  // Show loading spinner
}

// Check error state
if (salesStatisticsStore.error) {
  // Show error message
}
```

## Database Query Logic

### 1. Monthly Statistics
```sql
-- Total 1 bulan terakhir
SELECT SUM(total) FROM sales_orders 
WHERE status = 'delivered' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)

-- Total 2 bulan lalu (untuk perbandingan)
SELECT SUM(total) FROM sales_orders 
WHERE status = 'delivered' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
AND created_at < DATE_SUB(NOW(), INTERVAL 1 MONTH)
```

### 2. Weekly Statistics
```sql
-- Data per minggu (4 minggu terakhir)
SELECT SUM(total) FROM sales_orders 
WHERE status = 'delivered' 
AND created_at >= [week_start]
AND created_at < [week_end]
```

### 3. Daily Statistics
```sql
-- Data hari ini
SELECT SUM(total) FROM sales_orders 
WHERE status = 'delivered' 
AND DATE(created_at) = CURDATE()
```

## Performance Considerations

### 1. Database Optimization
- Query menggunakan index pada kolom `status` dan `created_at`
- Aggregation menggunakan `SUM()` untuk efisiensi
- Filtering berdasarkan status 'delivered' untuk relevansi

### 2. Frontend Optimization
- Lazy loading data saat komponen dimount
- Caching data di Pinia store
- Debounced refresh untuk menghindari spam request

### 3. Error Handling
- Graceful degradation saat API error
- Retry mechanism untuk failed requests
- User-friendly error messages

## Future Enhancements

### 1. Additional Metrics
- Top performing products
- Customer segmentation
- Regional sales analysis
- Seasonal trends

### 2. Visualization
- Charts dan graphs
- Trend lines
- Comparative analysis

### 3. Export Features
- PDF reports
- Excel export
- Scheduled reports

## Troubleshooting

### 1. Data Tidak Muncul
- Periksa koneksi database
- Pastikan ada sales order dengan status 'delivered'
- Cek console untuk error messages

### 2. Performance Lambat
- Periksa index database
- Optimize query dengan LIMIT
- Implement caching jika diperlukan

### 3. Format Error
- Periksa locale settings
- Pastikan currency formatting sesuai
- Validasi data sebelum formatting

## Dependencies

### Backend
- AdonisJS Framework
- Lucid ORM
- Luxon (untuk date handling)

### Frontend
- Nuxt 3
- Pinia (state management)
- Vue 3 Composition API
- Remixicon (icons)

## Security Considerations

### 1. Authentication
- Endpoint dilindungi dengan middleware auth
- Token validation untuk setiap request

### 2. Authorization
- Role-based access control
- Permission checking untuk sensitive data

### 3. Data Validation
- Input sanitization
- SQL injection prevention
- XSS protection

## Testing

### 1. Unit Tests
- Test store methods
- Test API endpoints
- Test data formatting

### 2. Integration Tests
- Test API integration
- Test component rendering
- Test error scenarios

### 3. E2E Tests
- Test user workflows
- Test data accuracy
- Test performance metrics
