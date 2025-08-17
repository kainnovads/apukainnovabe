# Sistem Tracking User Session

Sistem ini memungkinkan Anda untuk memantau user yang sedang login di aplikasi AdonisJS.

## Fitur

- ✅ Tracking user yang sedang online
- ✅ Informasi device (desktop/mobile/tablet)
- ✅ IP Address user
- ✅ User Agent browser
- ✅ Waktu login dan last activity
- ✅ Force logout user tertentu
- ✅ Auto cleanup session expired

## Cara Penggunaan

### 1. Login User
Ketika user login, sistem akan otomatis membuat session tracking dan mengembalikan `sessionId`:

```json
{
  "message": "Login berhasil",
  "token": {
    "type": "bearer",
    "token": "...",
    "expires_at": "..."
  },
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "User Name",
    "isActive": true,
    "roles": [...]
  },
  "sessionId": "abc123def456..."
}
```

### 2. Frontend Integration
Simpan `sessionId` yang diterima saat login dan kirim sebagai header di setiap request:

```javascript
// Simpan sessionId saat login
localStorage.setItem('sessionId', response.data.sessionId)

// Kirim sebagai header di setiap request
axios.defaults.headers.common['x-session-id'] = localStorage.getItem('sessionId')
```

### 3. API Endpoints

#### Mendapatkan User yang Sedang Online
```http
GET /api/user-sessions/active-users
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "sessionId": "abc123...",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "deviceType": "desktop",
      "isActive": true,
      "lastActivity": "2024-01-15T10:30:00.000Z",
      "loginAt": "2024-01-15T09:00:00.000Z",
      "logoutAt": null,
      "user": {
        "id": 1,
        "email": "user@example.com",
        "fullName": "User Name"
      }
    }
  ]
}
```

#### Mendapatkan Session User Tertentu
```http
GET /api/user-sessions/user/{userId}/sessions
Authorization: Bearer <token>
```

#### Force Logout User
```http
POST /api/user-sessions/force-logout/{sessionId}
Authorization: Bearer <token>
```

#### Cleanup Session Expired
```http
POST /api/user-sessions/cleanup-expired
Authorization: Bearer <token>
```

### 4. Command untuk Cleanup Manual

```bash
# Cleanup session yang sudah expired (lebih dari 24 jam tidak aktif)
node ace cleanup:user-sessions
```

### 5. Middleware

Middleware `userSession` sudah terdaftar dan akan otomatis update `lastActivity` setiap kali user melakukan request dengan header `x-session-id`.

## Database Schema

Tabel `user_sessions`:
- `id` - Primary key
- `user_id` - Foreign key ke users
- `session_id` - Unique session identifier
- `ip_address` - IP address user
- `user_agent` - Browser user agent
- `device_type` - desktop/mobile/tablet
- `is_active` - Status session aktif
- `last_activity` - Waktu aktivitas terakhir
- `login_at` - Waktu login
- `logout_at` - Waktu logout (nullable)
- `created_at` - Waktu dibuat
- `updated_at` - Waktu diupdate

## Keamanan

- Hanya admin dan superadmin yang bisa mengakses endpoint monitoring
- Session akan otomatis expired setelah 24 jam tidak aktif
- IP address dan user agent disimpan untuk audit trail

## Monitoring Dashboard

Anda bisa membuat dashboard untuk menampilkan:
- Jumlah user online real-time
- Daftar user yang sedang aktif
- Device yang digunakan
- Lokasi berdasarkan IP
- Aktivitas terakhir user
