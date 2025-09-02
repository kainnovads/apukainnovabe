# Journal System - APU ADN

Sistem Journal adalah modul akuntansi yang menangani pencatatan transaksi keuangan dalam bentuk jurnal. Sistem ini memastikan setiap transaksi dicatat dengan prinsip double-entry bookkeeping (debit = credit).

## 🏗️ Struktur Sistem Journal

### Journal Header
```
- ID (UUID)
- Journal Number (Unique)
- Date
- Description
- Status (draft, posted, cancelled)
- Reference Type (sales_invoice, purchase_invoice, expense, etc)
- Reference ID
- Created By
- Updated By
- Created At
- Updated At
```

### Journal Lines
```
- ID (UUID)
- Journal ID (Foreign Key)
- Account ID (Foreign Key)
- Debit Amount
- Credit Amount
- Description (Optional)
- Created At
- Updated At
```

## 🔧 Fitur Utama

### 1. Double-Entry Bookkeeping
- ✅ Validasi debit = credit
- ✅ Minimal 2 line items per jurnal
- ✅ Validasi akun yang valid
- ✅ Normal balance checking

### 2. Journal Status Management
- ✅ **Draft**: Jurnal masih bisa diedit
- ✅ **Posted**: Jurnal sudah diposting (tidak bisa diedit)
- ✅ **Cancelled**: Jurnal dibatalkan

### 3. Reference System
- ✅ Link ke transaksi lain (sales invoice, purchase invoice, expense)
- ✅ Tracking sumber transaksi
- ✅ Audit trail lengkap

### 4. Automatic Numbering
- ✅ Generate nomor jurnal otomatis
- ✅ Format: JRN-YYYYMMDD-XXX
- ✅ Sequence per hari

## 📋 API Endpoints

### CRUD Operations
```
GET    /api/journals                # Daftar semua jurnal
POST   /api/journals                # Buat jurnal baru
GET    /api/journals/:id            # Detail jurnal
PUT    /api/journals/:id            # Update jurnal
DELETE /api/journals/:id            # Hapus jurnal
```

### Special Operations
```
GET    /api/journals/summary              # Ringkasan jurnal
GET    /api/journals/trial-balance        # Trial balance
GET    /api/journals/generate-number      # Generate nomor jurnal
PATCH  /api/journals/:id/post             # Posting jurnal
PATCH  /api/journals/:id/cancel           # Membatalkan jurnal
```

## 🔍 Query Parameters

### Filtering
- `status` - Filter berdasarkan status (draft, posted, cancelled)
- `referenceType` - Filter berdasarkan tipe referensi
- `startDate` - Filter berdasarkan tanggal mulai
- `endDate` - Filter berdasarkan tanggal akhir
- `search` - Pencarian berdasarkan nomor jurnal atau deskripsi

### Pagination
- `page` - Halaman (default: 1)
- `limit` - Limit per halaman (default: 10)

## 📝 Data Structure

### Journal Model
```typescript
{
  id: string                    // UUID primary key
  journalNumber: string         // Nomor jurnal (unique)
  date: Date                    // Tanggal jurnal
  description: string           // Deskripsi jurnal
  status: 'draft' | 'posted' | 'cancelled'
  referenceType: string | null  // Tipe referensi
  referenceId: string | null    // ID referensi
  createdBy: number             // User ID
  updatedBy: number             // User ID
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Journal Line Model
```typescript
{
  id: string                    // UUID primary key
  journalId: string             // Foreign key ke journal
  accountId: string             // Foreign key ke account
  debit: number                 // Jumlah debit
  credit: number                // Jumlah credit
  description: string | null    // Deskripsi line item
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Relationships
```typescript
// Journal
journalLines: HasMany<typeof JournalLine>
createdByUser: BelongsTo<typeof User>
updatedByUser: BelongsTo<typeof User>

// Journal Line
journal: BelongsTo<typeof Journal>
account: BelongsTo<typeof Account>
```

## 🛡️ Validation Rules

### Create Journal
- `journalNumber`: Required, unique, max 50 characters
- `date`: Required, valid date
- `description`: Required, max 500 characters
- `status`: Required, enum values
- `journalLines`: Required, min 2 items, debit = credit
- `createdBy`: Required, positive number
- `updatedBy`: Required, positive number

### Journal Lines Validation
- `accountId`: Required, must exist
- `debit`: Required, min 0
- `credit`: Required, min 0
- `description`: Optional
- Debit atau credit harus salah satu saja (tidak boleh keduanya)

### Balance Validation
- Total debit = Total credit
- Toleransi 0.01 untuk floating point precision

## 🔄 Business Logic

### Journal Creation
1. Validate unique journal number
2. Validate account exists for each line
3. Validate debit = credit balance
4. Validate line item rules (debit OR credit)
5. Create journal with transaction
6. Create journal lines with transaction

### Journal Update
1. Validate journal exists
2. Validate status (cannot edit posted journal)
3. Validate unique journal number (if changed)
4. Validate balance and line items (if changed)
5. Update with transaction

### Journal Posting
1. Validate journal exists
2. Validate status is draft
3. Update status to posted
4. Update with transaction

### Journal Cancellation
1. Validate journal exists
2. Validate status is not cancelled
3. Update status to cancelled
4. Update with transaction

### Journal Deletion
1. Validate journal exists
2. Validate status is not posted
3. Delete journal and lines with transaction

## 📊 Reporting Features

### Journal Summary
- Total journals count
- Draft journals count
- Posted journals count
- Cancelled journals count

### Trial Balance
- Account balances from posted journals
- Debit and credit totals
- Account codes and names
- Normal balance validation

### Journal Number Generation
- Automatic sequence per day
- Format: JRN-YYYYMMDD-XXX
- Unique numbering system

## 🔐 Security & Permissions

### Required Permissions
- `view_journal` - Melihat daftar jurnal
- `create_journal` - Membuat jurnal baru
- `edit_journal` - Mengedit jurnal
- `delete_journal` - Menghapus jurnal
- `show_journal` - Melihat detail jurnal
- `post_journal` - Posting jurnal
- `cancel_journal` - Membatalkan jurnal

### Access Control
- Role-based access control
- Permission-based operations
- Audit trail for changes
- Data integrity protection

## 🚀 Setup Instructions

### 1. Run Migration
```bash
node ace migration:run
```

### 2. Seed Permissions
```bash
node ace db:seed --files="./database/seeders/finance_permissions_seeder.ts"
```

### 3. Assign Permissions
Assign journal permissions to appropriate roles through admin panel.

### 4. Setup Chart of Accounts
Ensure Chart of Accounts is properly set up before creating journals.

## 📈 Best Practices

### Journal Creation
- Always validate balance before posting
- Use descriptive journal descriptions
- Link to source documents when possible
- Review before posting

### Journal Management
- Regular backup of journal data
- Monitor for unusual transactions
- Maintain audit trail
- Regular reconciliation

### Data Integrity
- Validate all transactions
- Maintain referential integrity
- Regular data validation
- Test before production

## 🔧 Integration Points

### Chart of Accounts
- Account validation
- Normal balance checking
- Account hierarchy support
- Balance calculation

### Financial Reports
- Trial balance generation
- Balance sheet
- Income statement
- General ledger

### Other Modules
- Sales invoice integration
- Purchase invoice integration
- Expense integration
- Asset depreciation

## 📞 Support

Untuk pertanyaan atau bantuan terkait sistem Journal, silakan hubungi tim development atau buat issue di repository.
