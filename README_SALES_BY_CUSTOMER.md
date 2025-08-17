# Implementasi Sales by Customer Dashboard

## Overview
Implementasi ini mengubah card "Sales Country" menjadi "Sales by Customer" yang menampilkan data penjualan berdasarkan customer dengan desain horizontal bar chart yang mirip dengan gambar referensi.

## Fitur yang Ditambahkan

### 1. Backend API Endpoint
**File:** `adn-be/app/controllers/sales_controller.ts`

#### Method: `getSalesByCustomer()`
Endpoint baru yang mengembalikan:
- Data penjualan berdasarkan customer untuk 1 bulan terakhir
- Total penjualan per customer
- Warna unik untuk setiap customer
- Persentase kontribusi setiap customer

**Route:** `GET /api/sales-order/salesByCustomer`

### 2. Frontend Store
**File:** `nuxt-erp/stores/sales-by-customer.ts`

Store Pinia yang mengelola:
- State untuk data penjualan customer
- Getters untuk formatting data (currency, chart data)
- Actions untuk fetch dan refresh data
- Error handling dan loading states

### 3. Dashboard Component

#### Card Sales by Customer (Updated)
- Menampilkan 5 customer teratas berdasarkan total penjualan
- Horizontal bar chart dengan warna berbeda untuk setiap customer
- Total penjualan dalam format Rupiah
- Loading states dan error handling
- Dropdown menu untuk aksi tambahan

## Struktur Data API Response

```json
{
  "totalSales": 42580000,
  "customers": [
    {
      "customer": "PT Maju Bersama",
      "sales": 17165000,
      "color": "#696cff",
      "percentage": "40.3"
    },
    {
      "customer": "CV Sukses Mandiri",
      "sales": 13850000,
      "color": "#71dd37",
      "percentage": "32.5"
    },
    {
      "customer": "UD Makmur Jaya",
      "sales": 12375000,
      "color": "#ffab00",
      "percentage": "29.1"
    }
  ]
}
```

## Fitur Utama

### 1. Real-time Data
- Data diambil dari database sales order dengan status 'delivered'
- Filter berdasarkan 1 bulan terakhir
- Auto-refresh saat halaman dimuat
- Manual refresh melalui dropdown menu

### 2. Visual Design
- Horizontal bar chart dengan progress bar
- Warna unik untuk setiap customer (5 warna berbeda)
- Animasi shimmer effect pada progress bar
- Responsive design untuk mobile

### 3. Data Formatting
- Currency formatting dalam Rupiah
- Customer name dengan ellipsis untuk nama panjang
- Persentase kontribusi setiap customer

### 4. Interactive Features
- Dropdown menu dengan opsi Refresh, Export, Share
- Loading spinner saat data sedang dimuat
- Error handling dengan tombol retry
- Hover effects pada progress bar

## Database Query Logic

```sql
SELECT 
  customers.name as customer_name,
  customers.id as customer_id,
  SUM(sales_orders.total) as total_sales
FROM sales_orders
LEFT JOIN customers ON sales_orders.customer_id = customers.id
WHERE sales_orders.status = 'delivered'
  AND sales_orders.created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
GROUP BY customers.id, customers.name
ORDER BY total_sales DESC
LIMIT 5
```

## Color Scheme

Sistem menggunakan 5 warna berbeda untuk customer:
1. **#696cff** - Purple (Customer #1)
2. **#71dd37** - Green (Customer #2)
3. **#ffab00** - Orange (Customer #3)
4. **#ff3e1d** - Red (Customer #4)
5. **#03c3ec** - Blue (Customer #5)

## Cara Penggunaan

### 1. Mengakses Data
```javascript
// Di component Vue
import { useSalesByCustomerStore } from '~/stores/sales-by-customer'

const salesByCustomerStore = useSalesByCustomerStore()

// Fetch data
await salesByCustomerStore.fetchSalesByCustomer()

// Access formatted data
console.log(salesByCustomerStore.formattedTotalSales)
console.log(salesByCustomerStore.chartData)
```

### 2. Refresh Data
```javascript
// Manual refresh
await salesByCustomerStore.refreshData()
```

### 3. Error Handling
```javascript
// Check loading state
if (salesByCustomerStore.loading) {
  // Show loading spinner
}

// Check error state
if (salesByCustomerStore.error) {
  // Show error message
}
```

## CSS Styling

### Progress Bar Animation
```css
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

### Responsive Design
```css
@media (max-width: 768px) {
  .customer-name {
    max-width: 80px;
  }
  
  .customer-sales {
    font-size: 0.75rem;
  }
}
```

## Performance Considerations

### 1. Database Optimization
- Query menggunakan index pada kolom `status`, `created_at`, dan `customer_id`
- Aggregation menggunakan `SUM()` untuk efisiensi
- Filtering berdasarkan status 'delivered' dan periode 1 bulan
- Limit 5 customer untuk performa optimal

### 2. Frontend Optimization
- Lazy loading data saat komponen dimount
- Caching data di Pinia store
- Efficient re-rendering dengan Vue reactivity

### 3. Visual Performance
- CSS animations menggunakan transform untuk GPU acceleration
- Efficient color calculations
- Responsive breakpoints untuk mobile optimization

## Future Enhancements

### 1. Additional Features
- Drill-down ke detail customer
- Filter berdasarkan periode waktu
- Export data ke Excel/PDF
- Real-time updates dengan WebSocket

### 2. Visualization Improvements
- Interactive tooltips dengan detail lengkap
- Zoom dan pan functionality
- Animated transitions saat data berubah
- Dark mode support

### 3. Data Analytics
- Trend analysis per customer
- Customer segmentation
- Predictive analytics
- Performance benchmarking

## Troubleshooting

### 1. Data Tidak Muncul
- Periksa koneksi database
- Pastikan ada sales order dengan status 'delivered'
- Cek relasi antara sales_orders dan customers
- Verifikasi periode waktu query

### 2. Performance Issues
- Periksa index database pada kolom yang digunakan
- Optimize query dengan EXPLAIN
- Implement caching jika diperlukan
- Monitor query execution time

### 3. Visual Issues
- Periksa CSS compatibility
- Test responsive design di berbagai device
- Verify color scheme accessibility
- Check animation performance

## Dependencies

### Backend
- AdonisJS Framework
- Lucid ORM
- Luxon (untuk date handling)
- Database dengan support JOIN dan aggregation

### Frontend
- Nuxt 3
- Pinia (state management)
- Vue 3 Composition API
- CSS3 dengan animations dan gradients

## Security Considerations

### 1. Authentication
- Endpoint dilindungi dengan middleware auth
- Token validation untuk setiap request

### 2. Authorization
- Role-based access control
- Permission checking untuk sensitive data

### 3. Data Privacy
- Customer data protection
- GDPR compliance considerations
- Data anonymization jika diperlukan

## Testing

### 1. Unit Tests
- Test store methods
- Test API endpoints
- Test data formatting

### 2. Integration Tests
- Test API integration
- Test component rendering
- Test error scenarios

### 3. Visual Tests
- Test responsive design
- Test color accessibility
- Test animation performance
