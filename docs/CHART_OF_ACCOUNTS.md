# Chart of Accounts - APU ADN

Chart of Accounts (COA) adalah struktur hierarkis dari semua akun yang digunakan dalam sistem akuntansi perusahaan. COA ini dirancang untuk mendukung sistem akuntansi yang komprehensif dan terintegrasi.

## 🏗️ Struktur Chart of Accounts

### Level 1 - Kategori Utama
```
1. Assets (Aktiva)
2. Liabilities (Kewajiban)
3. Equity (Ekuitas)
4. Revenue (Pendapatan)
5. Expenses (Beban)
```

### Level 2 - Sub Kategori
```
Assets:
├── 1-1000 Current Assets (Aktiva Lancar)
└── 1-2000 Fixed Assets (Aktiva Tetap)

Liabilities:
├── 2-1000 Current Liabilities (Kewajiban Lancar)
└── 2-2000 Long Term Liabilities (Kewajiban Jangka Panjang)

Equity:
└── 3-1000 Owner Equity (Ekuitas Pemilik)

Revenue:
├── 4-1000 Operating Revenue (Pendapatan Operasional)
└── 4-2000 Other Revenue (Pendapatan Lainnya)

Expenses:
├── 5-1000 Operating Expenses (Beban Operasional)
└── 5-2000 Other Expenses (Beban Lainnya)
```

### Level 3 - Akun Detail
```
Current Assets:
├── 1-1001 Cash (Kas)
├── 1-1002 Bank (Bank)
├── 1-1003 Accounts Receivable (Piutang Usaha)
└── 1-1004 Inventory (Persediaan)

Fixed Assets:
├── 1-2001 Equipment (Peralatan)
├── 1-2002 Buildings (Bangunan)
└── 1-2003 Vehicles (Kendaraan)

Current Liabilities:
├── 2-1001 Accounts Payable (Hutang Usaha)
└── 2-1002 Short Term Loans (Pinjaman Jangka Pendek)

Owner Equity:
├── 3-1001 Owner Investment (Investasi Pemilik)
└── 3-1002 Retained Earnings (Laba Ditahan)

Operating Revenue:
├── 4-1001 Sales Revenue (Pendapatan Penjualan)
└── 4-1002 Service Revenue (Pendapatan Jasa)

Operating Expenses:
├── 5-1001 Cost of Goods Sold (Harga Pokok Penjualan)
├── 5-1002 Salaries and Wages (Gaji dan Upah)
├── 5-1003 Rent Expense (Beban Sewa)
└── 5-1004 Utilities Expense (Beban Utilitas)
```

## 📊 Normal Balance

Setiap akun memiliki saldo normal yang menentukan apakah akun tersebut bertambah di sisi debit atau kredit:

### Debit Normal Balance
- **Assets** (Aktiva) - Bertambah di debit, berkurang di kredit
- **Expenses** (Beban) - Bertambah di debit, berkurang di kredit

### Credit Normal Balance
- **Liabilities** (Kewajiban) - Bertambah di kredit, berkurang di debit
- **Equity** (Ekuitas) - Bertambah di kredit, berkurang di debit
- **Revenue** (Pendapatan) - Bertambah di kredit, berkurang di debit

## 🔧 Fitur Utama

### 1. Hierarchical Structure
- ✅ Parent-child relationships
- ✅ Multiple levels (1-10 levels)
- ✅ Automatic level calculation
- ✅ Tree view support

### 2. Account Validation
- ✅ Unique account codes
- ✅ Parent account validation
- ✅ Circular reference prevention
- ✅ Deletion constraints

### 3. Account Categories
- ✅ Asset accounts
- ✅ Liability accounts
- ✅ Equity accounts
- ✅ Revenue accounts
- ✅ Expense accounts

### 4. Normal Balance Tracking
- ✅ Debit normal balance
- ✅ Credit normal balance
- ✅ Automatic balance validation
- ✅ Journal entry validation

## 📋 API Endpoints

### CRUD Operations
```
GET    /api/accounts                # Daftar semua akun
POST   /api/accounts                # Buat akun baru
GET    /api/accounts/:id            # Detail akun
PUT    /api/accounts/:id            # Update akun
DELETE /api/accounts/:id            # Hapus akun
```

### Special Endpoints
```
GET    /api/accounts/chart-of-accounts     # Chart of Accounts (hierarchical)
GET    /api/accounts/category/:category    # Akun berdasarkan kategori
GET    /api/accounts/parent-accounts       # Daftar akun parent
GET    /api/accounts/summary              # Ringkasan akun
```

## 🔍 Query Parameters

### Filtering
- `category` - Filter berdasarkan kategori (asset, liability, equity, revenue, expense)
- `level` - Filter berdasarkan level hierarki (1-10)
- `isParent` - Filter berdasarkan status parent/child (true/false)
- `search` - Pencarian berdasarkan kode atau nama akun

### Pagination
- `page` - Halaman (default: 1)
- `limit` - Limit per halaman (default: 10)

## 📝 Data Structure

### Account Model
```typescript
{
  id: string                    // UUID primary key
  code: string                  // Kode akun (unique)
  name: string                  // Nama akun
  category: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  normalBalance: 'debit' | 'credit'
  isParent: boolean             // Apakah akun parent
  parentId: string | null       // ID akun parent
  level: number                 // Level hierarki (1-10)
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Relationships
```typescript
// Self-referencing relationship
parent: BelongsTo<typeof Account>    // Akun parent
children: HasMany<typeof Account>    // Sub-akun

// Related models
journalLines: HasMany<typeof JournalLine>
cashTransactions: HasMany<typeof CashTransaction>
```

## 🛡️ Validation Rules

### Create Account
- `code`: Required, unique, max 20 characters
- `name`: Required, max 255 characters
- `category`: Required, enum values
- `normalBalance`: Required, enum values
- `isParent`: Required, boolean
- `parentId`: Optional, must exist if provided
- `level`: Required, positive number, max 10

### Update Account
- All fields optional except validation rules
- Code uniqueness check (excluding current account)
- Parent validation (cannot be self or non-existent)

### Delete Account
- Cannot delete if has children
- Cannot delete if used in journal lines
- Soft delete option available

## 🔄 Business Logic

### Account Creation
1. Validate unique code
2. Validate parent account exists (if provided)
3. Set appropriate level based on parent
4. Create account with transaction

### Account Update
1. Validate code uniqueness (if changed)
2. Validate parent account (if changed)
3. Prevent circular references
4. Update with transaction

### Account Deletion
1. Check for child accounts
2. Check for journal line usage
3. Delete with transaction

### Chart of Accounts Generation
1. Start with level 1 accounts (no parent)
2. Recursively load children
3. Build hierarchical structure
4. Sort by account code

## 📊 Reporting Features

### Account Summary
- Total accounts count
- Parent accounts count
- Child accounts count
- Category statistics

### Chart of Accounts Report
- Hierarchical view
- Account balances
- Account codes and names
- Parent-child relationships

### Category Reports
- Accounts by category
- Balance summaries
- Normal balance validation

## 🔐 Security & Permissions

### Required Permissions
- `view_account` - Melihat daftar akun
- `create_account` - Membuat akun baru
- `edit_account` - Mengedit akun
- `delete_account` - Menghapus akun
- `show_account` - Melihat detail akun

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

### 2. Seed Chart of Accounts
```bash
node ace db:seed --files="./database/seeders/chart_of_accounts_seeder.ts"
```

### 3. Assign Permissions
Assign account permissions to appropriate roles through admin panel.

### 4. Customize Accounts
Add or modify accounts according to business requirements.

## 📈 Best Practices

### Account Code Naming
- Use consistent numbering system
- Leave gaps for future accounts
- Use descriptive codes
- Maintain hierarchy in codes

### Account Structure
- Keep hierarchy manageable (max 10 levels)
- Use parent accounts for grouping
- Maintain consistent naming
- Regular review and cleanup

### Data Integrity
- Validate all transactions
- Maintain audit trail
- Regular backups
- Test before production

## 🔧 Integration Points

### Journal Entries
- Automatic account validation
- Normal balance checking
- Balance calculation
- Transaction posting

### Financial Reports
- Balance sheet generation
- Income statement
- Trial balance
- General ledger

### Other Modules
- Bank account integration
- Expense tracking
- Asset management
- Tax calculations

## 📞 Support

Untuk pertanyaan atau bantuan terkait Chart of Accounts, silakan hubungi tim development atau buat issue di repository.
