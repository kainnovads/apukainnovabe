# Dashboard User Tracking

Fitur ini menampilkan informasi real-time tentang user yang sedang login di aplikasi.

## Fitur yang Ditambahkan

### 1. **Card Total User Login**
- Menampilkan jumlah total user yang sedang online
- Breakdown berdasarkan device (Desktop, Mobile, Tablet)
- Tombol refresh untuk update data manual
- Auto-refresh setiap 30 detik

### 2. **Card User yang Sedang Online**
- Daftar 5 user terbaru yang sedang aktif
- Informasi detail user (nama, email, device, waktu aktivitas terakhir)
- Tombol force logout untuk setiap user
- Menu dropdown dengan opsi refresh dan cleanup session expired

## Komponen yang Dibuat

### Store: `nuxt-erp/stores/user-session.ts`
```typescript
// State
activeUsers: [] // Array user session aktif
loading: false // Status loading
error: null // Error message

// Getters
totalActiveUsers // Jumlah total user aktif
activeUsersByDevice // Breakdown berdasarkan device
recentActiveUsers // 5 user terbaru

// Actions
fetchActiveUsers() // Ambil data user aktif
forceLogoutUser(sessionId) // Force logout user
cleanupExpiredSessions() // Cleanup session expired
```

### API Endpoints
```typescript
// Ditambahkan ke plugins/api.client.ts
userSessionsActiveUsers: () => `${apiBase}/user-sessions/active-users`
userSessionsForceLogout: (sessionId) => `${apiBase}/user-sessions/force-logout/${sessionId}`
userSessionsCleanupExpired: () => `${apiBase}/user-sessions/cleanup-expired`
```

## Cara Penggunaan

### 1. **Melihat Total User Online**
- Card "Total User Login" menampilkan angka total user yang sedang online
- Breakdown device ditampilkan di bawah angka total
- Tombol refresh untuk update manual

### 2. **Melihat Daftar User Aktif**
- Card "User yang Sedang Online" menampilkan daftar user
- Setiap user menampilkan:
  - Nama dan email
  - Tipe device (Desktop/Mobile/Tablet)
  - Waktu aktivitas terakhir
  - Tombol force logout

### 3. **Force Logout User**
- Klik tombol logout (ikon logout) pada user tertentu
- Konfirmasi akan muncul
- User akan di-logout secara paksa

### 4. **Cleanup Session Expired**
- Klik menu dropdown pada card "User yang Sedang Online"
- Pilih "Cleanup Expired"
- Session yang sudah expired akan dibersihkan

## Auto-Refresh

- Data user session akan auto-refresh setiap 30 detik
- Interval akan dibersihkan saat komponen di-unmount
- Manual refresh tersedia melalui tombol refresh

## Keamanan

- Hanya admin dan superadmin yang bisa mengakses fitur ini
- Force logout memerlukan konfirmasi
- Session expired akan otomatis dibersihkan setelah 24 jam

## Styling

- Menggunakan Bootstrap classes yang konsisten dengan tema
- Responsive design untuk mobile dan desktop
- Loading state dan error handling
- Icon menggunakan Remix Icons

## Integrasi dengan Backend

Fitur ini terintegrasi dengan sistem tracking user session yang telah dibuat di backend AdonisJS:

- Model `UserSession`
- Service `UserSessionService`
- Controller `UserSessionsController`
- Middleware `userSession`

## Troubleshooting

### Jika data tidak muncul:
1. Pastikan user memiliki role admin/superadmin
2. Cek network tab untuk error API
3. Pastikan backend berjalan dengan baik
4. Cek console untuk error JavaScript

### Jika force logout gagal:
1. Pastikan session ID valid
2. Cek permission user
3. Pastikan backend endpoint berfungsi

## Pengembangan Selanjutnya

- Real-time update menggunakan WebSocket
- Filter berdasarkan device type
- Export data user session
- Detail activity log per user
- Geolocation tracking berdasarkan IP
