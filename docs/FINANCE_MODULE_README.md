# Modul Finance - APU ADN

Modul Finance adalah sistem manajemen keuangan yang terintegrasi dengan modul ERP lainnya. Modul ini menangani semua aspek keuangan perusahaan termasuk bank & cash, pengeluaran, piutang, hutang, aset, dan pajak.

## 🏗️ Arsitektur Modul

### Flow Modul Finance (High Level)

```
Bank & Cash Setup
├── Daftar rekening bank perusahaan
├── Saldo awal
└── Petty cash (kas kecil)

Transaksi Penjualan (AR / Piutang)
├── Sales Invoice → Piutang
├── Customer bayar → AR Receipts
└── Relasi detail ke invoice (ar_settlements)

Transaksi Pembelian (AP / Hutang)
├── Purchase Invoice → Hutang
├── Bayar ke vendor → AP Payments
└── Relasi detail ke invoice (ap_settlements)

Pengeluaran Lainnya (Expenses)
├── Biaya operasional non-PO
├── Listrik, air, ATK, perjalanan dinas
└── Pilihan pembayaran: kas/bank

Fixed Asset & Depresiasi
├── Aset perusahaan (mobil, mesin)
├── Generate depresiasi otomatis
└── Entry ke jurnal akuntansi

Pajak (Taxes)
├── Definisi pajak (PPN, PPh)
├── Link ke transaksi
├── Perhitungan otomatis
└── Laporan pajak bulanan/tahunan

Jurnal Otomatis
├── Semua transaksi trigger jurnal
├── Debit/Kredit otomatis
└── Integrasi dengan modul Accounting
```

## 📁 Struktur File

### Controllers
```
app/controllers/
├── bank_accounts_controller.ts      # Rekening Bank
├── taxes_controller.ts              # Pajak
├── expenses_controller.ts           # Pengeluaran
├── ap_payments_controller.ts        # Pembayaran Hutang
├── ar_receipts_controller.ts        # Penerimaan Piutang
├── assets_controller.ts             # Aset
├── accounts_controller.ts           # Chart of Accounts
└── finance_dashboard_controller.ts  # Dashboard Keuangan
```

### Validators
```
app/validators/
├── bank_account_validator.ts
├── tax_validator.ts
├── expense_validator.ts
├── ap_payment_validator.ts
├── ar_receipt_validator.ts
├── asset_validator.ts
└── account_validator.ts
```

### Models
```
app/models/
├── bank_account.ts
├── tax.ts
├── expense.ts
├── ap_payment.ts
├── ar_receipt.ts
├── asset.ts
└── account.ts
```

## 🚀 Fitur Utama

### 1. Bank & Cash Management
- ✅ Manajemen rekening bank perusahaan
- ✅ Saldo awal dan mutasi
- ✅ Petty cash management
- ✅ Multi-currency support

### 2. Expense Management
- ✅ Pengeluaran operasional
- ✅ Approval workflow
- ✅ Department-based expenses
- ✅ Payment method tracking

### 3. Accounts Payable (AP)
- ✅ Pembayaran hutang ke vendor
- ✅ Link ke purchase invoice
- ✅ Payment scheduling
- ✅ Vendor payment history

### 4. Accounts Receivable (AR)
- ✅ Penerimaan piutang dari customer
- ✅ Link ke sales invoice
- ✅ Payment tracking
- ✅ Customer payment history

### 5. Asset Management
- ✅ Fixed asset tracking
- ✅ Depreciation calculation
- ✅ Asset categories
- ✅ Maintenance history

### 6. Tax Management
- ✅ Tax configuration
- ✅ Automatic tax calculation
- ✅ Tax reporting
- ✅ Multi-tax support

### 7. Chart of Accounts
- ✅ Hierarchical account structure
- ✅ Normal balance tracking
- ✅ Account categories
- ✅ Parent-child relationships

### 8. Financial Dashboard
- ✅ Real-time financial overview
- ✅ Cash flow analysis
- ✅ Expense summary
- ✅ Asset valuation

## 🔧 Teknologi & Optimasi

### Database Optimization
- ✅ **N+1 Query Prevention**: Menggunakan `preload()` untuk relasi
- ✅ **Database Transactions**: Semua operasi CRUD menggunakan transaction
- ✅ **Pagination**: Implementasi pagination untuk performa optimal
- ✅ **Indexing**: Query optimization dengan proper indexing

### Performance Features
- ✅ **Lazy Loading**: Relasi dimuat sesuai kebutuhan
- ✅ **Query Filtering**: Search dan filter yang efisien
- ✅ **Caching Ready**: Struktur yang siap untuk caching
- ✅ **Batch Operations**: Support untuk operasi batch

### Security Features
- ✅ **Permission-based Access**: RBAC (Role-Based Access Control)
- ✅ **Input Validation**: Validasi data dengan VineJS
- ✅ **SQL Injection Prevention**: Menggunakan ORM
- ✅ **Transaction Safety**: Rollback otomatis jika error

## 📊 API Endpoints

### Dashboard & Reports
```
GET /api/finance/dashboard          # Dashboard keuangan
GET /api/finance/cash-flow          # Laporan arus kas
GET /api/finance/tax-report         # Laporan pajak
```

### Bank Accounts
```
GET    /api/bank-accounts           # Daftar rekening
POST   /api/bank-accounts           # Buat rekening
GET    /api/bank-accounts/:id       # Detail rekening
PUT    /api/bank-accounts/:id       # Update rekening
DELETE /api/bank-accounts/:id       # Hapus rekening
```

### Expenses
```
GET    /api/expenses                # Daftar pengeluaran
POST   /api/expenses                # Buat pengeluaran
GET    /api/expenses/:id            # Detail pengeluaran
PUT    /api/expenses/:id            # Update pengeluaran
DELETE /api/expenses/:id            # Hapus pengeluaran
GET    /api/expenses/summary        # Ringkasan pengeluaran
```

### AP Payments (Pembayaran Hutang)
```
GET    /api/ap-payments             # Daftar pembayaran hutang
POST   /api/ap-payments             # Buat pembayaran hutang
GET    /api/ap-payments/:id         # Detail pembayaran hutang
PUT    /api/ap-payments/:id         # Update pembayaran hutang
DELETE /api/ap-payments/:id         # Hapus pembayaran hutang
GET    /api/ap-payments/summary     # Ringkasan pembayaran hutang
```

### AR Receipts (Penerimaan Piutang)
```
GET    /api/ar-receipts             # Daftar penerimaan piutang
POST   /api/ar-receipts             # Buat penerimaan piutang
GET    /api/ar-receipts/:id         # Detail penerimaan piutang
PUT    /api/ar-receipts/:id         # Update penerimaan piutang
DELETE /api/ar-receipts/:id         # Hapus penerimaan piutang
GET    /api/ar-receipts/summary     # Ringkasan penerimaan piutang
```

### Assets
```
GET    /api/assets                  # Daftar aset
POST   /api/assets                  # Buat aset
GET    /api/assets/:id              # Detail aset
PUT    /api/assets/:id              # Update aset
DELETE /api/assets/:id              # Hapus aset
GET    /api/assets/categories       # Daftar kategori aset
GET    /api/assets/summary          # Ringkasan aset
GET    /api/assets/:id/calculate-depreciation  # Hitung depresiasi
```

### Accounts (Chart of Accounts)
```
GET    /api/accounts                # Daftar akun
POST   /api/accounts                # Buat akun
GET    /api/accounts/:id            # Detail akun
PUT    /api/accounts/:id            # Update akun
DELETE /api/accounts/:id            # Hapus akun
GET    /api/accounts/chart-of-accounts  # Chart of Accounts
GET    /api/accounts/category/:category  # Akun berdasarkan kategori
GET    /api/accounts/parent-accounts     # Daftar akun parent
GET    /api/accounts/summary        # Ringkasan akun
```

### Taxes
```
GET    /api/taxes                   # Daftar pajak
POST   /api/taxes                   # Buat pajak
GET    /api/taxes/:id               # Detail pajak
PUT    /api/taxes/:id               # Update pajak
DELETE /api/taxes/:id               # Hapus pajak
GET    /api/taxes/active            # Daftar pajak aktif
```

## 🔐 Permission System

### Permission List
- `view_bank_account`, `create_bank_account`, `edit_bank_account`, `delete_bank_account`, `show_bank_account`
- `view_tax`, `create_tax`, `edit_tax`, `delete_tax`, `show_tax`
- `view_expenses`, `create_expenses`, `edit_expenses`, `delete_expenses`, `show_expenses`
- `view_ap_payment`, `create_ap_payment`, `edit_ap_payment`, `delete_ap_payment`, `show_ap_payment`
- `view_ar_receipt`, `create_ar_receipt`, `edit_ar_receipt`, `delete_ar_receipt`, `show_ar_receipt`
- `view_asset`, `create_asset`, `edit_asset`, `delete_asset`, `show_asset`
- `view_account`, `create_account`, `edit_account`, `delete_account`, `show_account`

## 🛠️ Setup & Installation

### 1. Run Migrations
```bash
node ace migration:run
```

### 2. Seed Permissions
```bash
node ace db:seed --files="./database/seeders/finance_permissions_seeder.ts"
```

### 3. Seed Chart of Accounts
```bash
node ace db:seed --files="./database/seeders/chart_of_accounts_seeder.ts"
```

### 4. Assign Permissions to Roles
Assign permission yang diperlukan ke role yang sesuai melalui admin panel.

## 📈 Monitoring & Analytics

### Key Metrics
- Total bank balance
- Monthly expenses
- AP/AR aging
- Asset depreciation
- Tax liabilities

### Reports Available
- Cash flow statement
- Expense analysis
- Vendor payment history
- Customer payment history
- Asset depreciation report
- Tax summary report

## 🔄 Integration Points

### Internal Modules
- **Sales Module**: AR Receipts linked to Sales Invoices
- **Purchase Module**: AP Payments linked to Purchase Invoices
- **Inventory Module**: Asset tracking for inventory items
- **HR Module**: Expense tracking by department

### External Systems
- **Banking APIs**: Real-time bank balance
- **Tax Authorities**: Automated tax reporting
- **Accounting Software**: Journal entries export

## 🚨 Error Handling

### Database Errors
- Transaction rollback on errors
- Detailed error messages
- Logging for debugging

### Validation Errors
- Input validation with VineJS
- Custom error messages
- Field-level error reporting

### Permission Errors
- 403 Forbidden for unauthorized access
- Clear permission requirements
- Audit trail for access attempts

## 📝 Best Practices

### Code Quality
- ✅ TypeScript for type safety
- ✅ Consistent error handling
- ✅ Comprehensive validation
- ✅ Proper documentation

### Performance
- ✅ Optimized database queries
- ✅ Efficient pagination
- ✅ Proper indexing
- ✅ Caching strategies

### Security
- ✅ Input sanitization
- ✅ Permission-based access
- ✅ Audit logging
- ✅ Data encryption

## 🤝 Contributing

1. Follow the existing code structure
2. Add proper validation for new fields
3. Include database transactions
4. Update documentation
5. Add unit tests for new features

## 📞 Support

Untuk pertanyaan atau bantuan terkait modul Finance, silakan hubungi tim development atau buat issue di repository.
