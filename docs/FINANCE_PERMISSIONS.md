# Finance Module Permissions

Dokumentasi ini menjelaskan permission yang diperlukan untuk mengakses modul Finance.

## Permission List

### 1. Bank Accounts (Rekening Bank)
- `view_bank_account` - Melihat daftar rekening bank
- `create_bank_account` - Membuat rekening bank baru
- `edit_bank_account` - Mengedit rekening bank
- `delete_bank_account` - Menghapus rekening bank
- `show_bank_account` - Melihat detail rekening bank

### 2. Taxes (Pajak)
- `view_tax` - Melihat daftar pajak
- `create_tax` - Membuat pajak baru
- `edit_tax` - Mengedit pajak
- `delete_tax` - Menghapus pajak
- `show_tax` - Melihat detail pajak

### 3. Expenses (Pengeluaran)
- `view_expenses` - Melihat daftar pengeluaran
- `create_expenses` - Membuat pengeluaran baru
- `edit_expenses` - Mengedit pengeluaran
- `delete_expenses` - Menghapus pengeluaran
- `show_expenses` - Melihat detail pengeluaran

### 4. AP Payments (Pembayaran Hutang)
- `view_ap_payment` - Melihat daftar pembayaran hutang
- `create_ap_payment` - Membuat pembayaran hutang baru
- `edit_ap_payment` - Mengedit pembayaran hutang
- `delete_ap_payment` - Menghapus pembayaran hutang
- `show_ap_payment` - Melihat detail pembayaran hutang

### 5. AR Receipts (Penerimaan Piutang)
- `view_ar_receipt` - Melihat daftar penerimaan piutang
- `create_ar_receipt` - Membuat penerimaan piutang baru
- `edit_ar_receipt` - Mengedit penerimaan piutang
- `delete_ar_receipt` - Menghapus penerimaan piutang
- `show_ar_receipt` - Melihat detail penerimaan piutang

### 6. Assets (Aset)
- `view_asset` - Melihat daftar aset
- `create_asset` - Membuat aset baru
- `edit_asset` - Mengedit aset
- `delete_asset` - Menghapus aset
- `show_asset` - Melihat detail aset

### 7. Accounts (Chart of Accounts)
- `view_account` - Melihat daftar akun
- `create_account` - Membuat akun baru
- `edit_account` - Mengedit akun
- `delete_account` - Menghapus akun
- `show_account` - Melihat detail akun

### 8. Journals (Jurnal)
- `view_journal` - Melihat daftar jurnal
- `create_journal` - Membuat jurnal baru
- `edit_journal` - Mengedit jurnal
- `delete_journal` - Menghapus jurnal
- `show_journal` - Melihat detail jurnal
- `post_journal` - Posting jurnal
- `cancel_journal` - Membatalkan jurnal

## Route Endpoints

### Finance Dashboard (Tidak memerlukan permission khusus)
- `GET /api/finance/dashboard` - Dashboard keuangan
- `GET /api/finance/cash-flow` - Laporan arus kas
- `GET /api/finance/tax-report` - Laporan pajak

### Bank Accounts
- `GET /api/bank-accounts` - Daftar rekening bank
- `POST /api/bank-accounts` - Membuat rekening bank
- `GET /api/bank-accounts/:id` - Detail rekening bank
- `PUT /api/bank-accounts/:id` - Update rekening bank
- `DELETE /api/bank-accounts/:id` - Hapus rekening bank

### Taxes
- `GET /api/taxes` - Daftar pajak
- `POST /api/taxes` - Membuat pajak
- `GET /api/taxes/:id` - Detail pajak
- `PUT /api/taxes/:id` - Update pajak
- `DELETE /api/taxes/:id` - Hapus pajak
- `GET /api/taxes/active` - Daftar pajak aktif

### Expenses
- `GET /api/expenses` - Daftar pengeluaran
- `POST /api/expenses` - Membuat pengeluaran
- `GET /api/expenses/:id` - Detail pengeluaran
- `PUT /api/expenses/:id` - Update pengeluaran
- `DELETE /api/expenses/:id` - Hapus pengeluaran
- `GET /api/expenses/summary` - Ringkasan pengeluaran

### AP Payments
- `GET /api/ap-payments` - Daftar pembayaran hutang
- `POST /api/ap-payments` - Membuat pembayaran hutang
- `GET /api/ap-payments/:id` - Detail pembayaran hutang
- `PUT /api/ap-payments/:id` - Update pembayaran hutang
- `DELETE /api/ap-payments/:id` - Hapus pembayaran hutang
- `GET /api/ap-payments/summary` - Ringkasan pembayaran hutang

### AR Receipts
- `GET /api/ar-receipts` - Daftar penerimaan piutang
- `POST /api/ar-receipts` - Membuat penerimaan piutang
- `GET /api/ar-receipts/:id` - Detail penerimaan piutang
- `PUT /api/ar-receipts/:id` - Update penerimaan piutang
- `DELETE /api/ar-receipts/:id` - Hapus penerimaan piutang
- `GET /api/ar-receipts/summary` - Ringkasan penerimaan piutang

### Assets
- `GET /api/assets` - Daftar aset
- `POST /api/assets` - Membuat aset
- `GET /api/assets/:id` - Detail aset
- `PUT /api/assets/:id` - Update aset
- `DELETE /api/assets/:id` - Hapus aset
- `GET /api/assets/categories` - Daftar kategori aset
- `GET /api/assets/summary` - Ringkasan aset
- `GET /api/assets/:id/calculate-depreciation` - Hitung depresiasi aset

### Accounts (Chart of Accounts)
- `GET /api/accounts` - Daftar akun
- `POST /api/accounts` - Membuat akun
- `GET /api/accounts/:id` - Detail akun
- `PUT /api/accounts/:id` - Update akun
- `DELETE /api/accounts/:id` - Hapus akun
- `GET /api/accounts/chart-of-accounts` - Chart of Accounts
- `GET /api/accounts/category/:category` - Akun berdasarkan kategori
- `GET /api/accounts/parent-accounts` - Daftar akun parent
- `GET /api/accounts/summary` - Ringkasan akun

### Journals (Jurnal)
- `GET /api/journals` - Daftar jurnal
- `POST /api/journals` - Membuat jurnal
- `GET /api/journals/:id` - Detail jurnal
- `PUT /api/journals/:id` - Update jurnal
- `DELETE /api/journals/:id` - Hapus jurnal
- `GET /api/journals/summary` - Ringkasan jurnal
- `GET /api/journals/trial-balance` - Trial balance
- `GET /api/journals/generate-number` - Generate nomor jurnal
- `PATCH /api/journals/:id/post` - Posting jurnal
- `PATCH /api/journals/:id/cancel` - Membatalkan jurnal

## Query Parameters

### Expenses, AP Payments, AR Receipts
- `page` - Halaman (default: 1)
- `limit` - Limit per halaman (default: 10)
- `search` - Pencarian berdasarkan nomor/deskripsi
- `startDate` - Tanggal mulai (format: YYYY-MM-DD)
- `endDate` - Tanggal akhir (format: YYYY-MM-DD)

### Expenses
- `departemenId` - Filter berdasarkan departemen

### AP Payments
- `vendorId` - Filter berdasarkan vendor

### AR Receipts
- `customerId` - Filter berdasarkan customer

### Assets
- `category` - Filter berdasarkan kategori
- `isActive` - Filter berdasarkan status aktif

### Accounts
- `category` - Filter berdasarkan kategori (asset, liability, equity, revenue, expense)
- `level` - Filter berdasarkan level hierarki
- `isParent` - Filter berdasarkan status parent/child

### Journals
- `status` - Filter berdasarkan status (draft, posted, cancelled)
- `referenceType` - Filter berdasarkan tipe referensi
- `startDate` - Filter berdasarkan tanggal mulai
- `endDate` - Filter berdasarkan tanggal akhir

### Finance Dashboard
- `startDate` - Tanggal mulai untuk laporan
- `endDate` - Tanggal akhir untuk laporan

## Response Format

Semua endpoint mengembalikan response dengan format yang konsisten:

```json
{
  "status": "success|error",
  "data": {},
  "message": "Pesan response",
  "errors": {} // Hanya jika ada error validasi
}
```

## Middleware

Semua route Finance menggunakan middleware:
1. `auth()` - Autentikasi user
2. `hasPermission()` - Validasi permission sesuai endpoint

## Catatan Penting

1. **Dashboard Finance** dapat diakses oleh semua user yang sudah login (tidak memerlukan permission khusus)
2. **CRUD Operations** memerlukan permission yang sesuai
3. **Summary/Report endpoints** memerlukan permission view yang sesuai
4. Semua operasi menggunakan **database transaction** untuk konsistensi data
5. Implementasi **pagination** untuk performa yang optimal
6. **Search dan filtering** tersedia untuk memudahkan pencarian data
