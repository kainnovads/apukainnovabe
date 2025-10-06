/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Controller
import CategoriesController from '#controllers/categories_controller'
import UnitsController from '#controllers/units_controller'
import CutisController from '#controllers/cutis_controller'
import DepartemenController from '#controllers/departemen_controller'
import DivisisController from '#controllers/divisis_controller'
import JabatansController from '#controllers/jabatans_controller'
import PegawaiController from '#controllers/pegawai_controller'
import CabangsController from '#controllers/cabangs_controller'
import PerusahaansController from '#controllers/perusahaans_controller'
import AuthController from '#controllers/Http/auth_controller'
import RolesController from '#controllers/Http/roles_controller'
import MenuGroupsController from '#controllers/menu_groups_controller'
import MenuDetailsController from '#controllers/menu_details_controller'
import PermissionsController from '#controllers/Http/permissions_controller'
import UsersController from '#controllers/Http/users_controller'
import WarehousesController from '#controllers/warehouses_controller'
import ProductsController from '#controllers/products_controller'
import VendorsController from '#controllers/vendors_controller'
import CustomersController from '#controllers/customers_controller'
import PurchasesController from '#controllers/purchases_controller'
import PurchaseItemsController from '#controllers/purchase_items_controller'
import StocksController from '#controllers/stocks_controller'
import StockInsController from '#controllers/stock_ins_controller'
import StockOutsController from '#controllers/stock_outs_controller'
import SalesOrdersController from '#controllers/sales_controller'
import SalesItemsController from '#controllers/sales_items_controller'
import SalesReturnsController from '#controllers/sales_returns_controller'
import StockTransfersController from '#controllers/stock_transfers_controller'
import AssociationsController from '#controllers/associations_controller'
import SalesInvoicesController from '#controllers/sales_invoices_controller'
import SuratJalansController from '#controllers/surat_jalans_controller'
import QuotationsController from '#controllers/quotations_controller'
import UserSessionsController from '#controllers/user_sessions_controller'
import ImportController from '#controllers/import_controller'
import StorageController from '#controllers/storage_controller'

// Finance Controllers
import BankAccountsController from '#controllers/bank_accounts_controller'
import TaxesController from '#controllers/taxes_controller'
import ExpensesController from '#controllers/expenses_controller'
import ApPaymentsController from '#controllers/ap_payments_controller'
import ArReceiptsController from '#controllers/ar_receipts_controller'
import AssetsController from '#controllers/assets_controller'
import FinanceDashboardController from '#controllers/finance_dashboard_controller'
import AccountsController from '#controllers/accounts_controller'
import JournalsController from '#controllers/journals_controller'
import PurchaseInvoicesController from '#controllers/purchase_invoices_controller'

router.get('/', async () => {
  return { message: 'Welcome to your API! Get your CSRF token here.' }
})

/// Test route
router.get('/test/gcs', async ({ response }) => {
  try {
    const GCSService = (await import('#services/gcs_service')).default
    const StorageService = (await import('#services/storage_service')).default
    
    const gcsService = new GCSService()
    const storageService = new StorageService()

    const config = gcsService.getConfigInfo()
    const isConnected = await gcsService.testConnection()
    const testResult = await storageService.testStorage()

    return response.ok({
      config,
      connection: isConnected,
      storage: testResult
    })
  } catch (error) {
    return response.badRequest({ error: error.message })
  }
})


// ✅ PERBAIKAN CORS: Storage management routes
router.group(() => {
  router.get('/storage/test', [StorageController, 'testStorage'])
  router.post('/storage/configure-cors', [StorageController, 'configureCors'])
  router.post('/storage/test-upload', [StorageController, 'testUpload'])
})
.prefix('/api')
.use(middleware.auth())
.use(middleware.hasRole(['superadmin', 'admin']))

router.get('/auth/api/csrf-token', async ({ response, request }) => {
  return response.ok({ token: request.csrfToken })
})

// All Route untuk semua role
router
.group(() => {
  router.get('/sales-order/countByStatus', [SalesOrdersController, 'countByStatus'])
  router.get('/sales-order/statistics', [SalesOrdersController, 'getSalesStatistics'])
  router.get('/sales-order/salesByCustomer', [SalesOrdersController, 'getSalesByCustomer'])
  
  // Finance Dashboard Routes
  router.get('/finance/dashboard', [FinanceDashboardController, 'index'])
  router.get('/finance/cash-flow', [FinanceDashboardController, 'getCashFlow'])
  router.get('/finance/tax-report', [FinanceDashboardController, 'getTaxReport'])
})
.prefix('/api')
.use(middleware.auth())

// Auth routes
router
  .group(() => {
    router.post('/register', [AuthController, 'register'])
    router.post('/login', [AuthController, 'login'])
    router.post('/refresh-token', [AuthController, 'refreshToken'])
    router.get('/me', [AuthController, 'me']).use(middleware.auth({ guards: ['api'] }))
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('/auth/api')


// ------------------ Route untuk Superadmin ------------------ //

router
  .group(() => {
    router.get('/users/countTotalUsers', [UsersController, 'countTotalUsers'])
    router.resource('users', UsersController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasRole(['superadmin']))

  // ------------------ Route Superadmin & Admin ------------------ //

  router.group(() => {
    router.get('/roles', [RolesController, 'index'])
    router.post('/roles/store', [RolesController, 'store'])
    router.put('/roles/update/:id', [RolesController, 'update'])
    router.get('/roles/:id', [RolesController, 'show'])
    router.delete('/roles/delete/:id', [RolesController, 'destroy'])
    router.get('/getPermissions', [RolesController, 'getPermissions'])

    router.get('/permissions/getTotalPermission', [PermissionsController, 'getTotalPermission'])
    router.resource('permissions', PermissionsController).apiOnly()
    router.get('/permissions/getMenuGroupDetails/:id', [PermissionsController, 'getMenuGroupDetails'])
    router.post('/permissions/batch', [PermissionsController, 'storeBatch'])

    router.post('/stock/validate-batch', [StocksController, 'validateStockBatch'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasRole(['superadmin', 'admin']))

  // ------------------ Route selain Superadmin & Admin ------------------ //

  // Purchase Order Router
  router.group(() => {
    router.patch('/purchase-order/approvePurchaseOrder/:id', [PurchasesController, 'approvePurchaseOrder'])
    router.patch('/purchase-order/rejectPurchaseOrder/:id', [PurchasesController, 'rejectPurchaseOrder'])
    router.post('/purchase-order/:id', [PurchasesController, 'update'])
    router.get('/purchase-order/getPurchaseOrderDetails/:id', [PurchasesController, 'getPurchaseOrderDetails'])
    router.get('/purchase-order/countByStatus', [PurchasesController, 'countByStatus'])
    router.get('/purchase-order/notifications', [PurchasesController, 'getNotifications'])
    router.resource('purchase-order', PurchasesController).except(['update']).apiOnly()

    // Purchase Order Item Router
    router.patch('/purchase-order-item/updateStatusPartial/:id', [PurchaseItemsController, 'updateStatusPartial'])
    router.post('/purchase-order/receiveAllItems/:id', [PurchaseItemsController, 'receiveAllItems'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['approve_purchase_order', 'reject_purchase_order', 'edit_purchase_order', 'delete_purchase_order', 'view_purchase_order', 'approve_purchase_order_item', 'reject_purchase_order_item', 'edit_purchase_order_item', 'delete_purchase_order_item', 'view_purchase_order_item', 'show_purchase_order', 'access_purchase_order']))

  // Purchase Invoice Router
  router.group(() => {
    router.get('/purchase-invoice/statistics', [PurchaseInvoicesController, 'getInvoiceStatistics'])
    router.resource('purchase-invoice', PurchaseInvoicesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_purchase_invoice', 'edit_purchase_invoice', 'delete_purchase_invoice', 'create_purchase_invoice', 'approve_purchase_invoice', 'reject_purchase_invoice', 'show_purchase_invoice', 'access_purchase_invoice']))

  // Sales Order Router
  router.group(() => {
    router.patch('/sales-order/approveSalesOrder/:id', [SalesOrdersController, 'approveSalesOrder'])
    router.patch('/sales-order/rejectSalesOrder/:id', [SalesOrdersController, 'rejectSalesOrder'])
    router.post('/sales-order/:id', [SalesOrdersController, 'update'])
    router.get('/sales-order/getSalesOrderDetails/:id', [SalesOrdersController, 'getSalesOrderDetails'])
    router.get('/sales-order/topProducts', [SalesOrdersController, 'getTopProducts'])
    router.get('/sales-order/notifications', [SalesOrdersController, 'getNotifications'])
    router.resource('sales-order', SalesOrdersController).except(['update']).apiOnly()

    // Sales Order Item Router
    router.patch('/sales-order-item/updateStatusPartial/:id', [SalesItemsController, 'updateStatusPartial'])
    router.post('/sales-order/deliverAllItems/:id', [SalesItemsController, 'deliverAllItems'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['approve_sales_order', 'reject_sales_order', 'edit_sales_order', 'delete_sales_order', 'view_sales_order', 'approve_sales_order_item', 'reject_sales_order_item', 'edit_sales_order_item', 'delete_sales_order_item', 'view_sales_order_item', 'show_sales_order', 'access_sales_order', 'access_sales_order_item']))

  // Sales Invoice Router
  router.group(() => {
    router.get('/sales-invoices/statistics', [SalesInvoicesController, 'getInvoiceStatistics'])
    router.resource('sales-invoices', SalesInvoicesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_sales_invoice', 'edit_sales_invoice', 'delete_sales_invoice', 'create_sales_invoice', 'approve_sales_invoice', 'reject_sales_invoice', 'show_sales_invoice', 'access_sales_invoice', 'access_sales_invoice_item']))



  // Surat Jalan Router
  router.group(() => {
    router.get('/surat-jalan/statistics', [SuratJalansController, 'getStatistics'])
    router.resource('surat-jalan', SuratJalansController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_surat_jalan', 'edit_surat_jalan', 'delete_surat_jalan', 'create_surat_jalan', 'approve_surat_jalan', 'reject_surat_jalan', 'show_surat_jalan', 'access_surat_jalan', 'access_surat_jalan_item']))

  // Sales Return Router
  router.group(() => {
    router.get('/sales-return/get-sales-order/:id', [SalesReturnsController, 'getSalesOrder'])
    router.post('/sales-return/:id', [SalesReturnsController, 'update'])
    router.patch('/sales-return/approveSalesReturn/:id', [SalesReturnsController, 'approveSalesReturn'])
    router.patch('/sales-return/rejectSalesReturn/:id', [SalesReturnsController, 'rejectSalesReturn'])
    router.resource('sales-return', SalesReturnsController).except(['update']).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['approve_sales_return', 'reject_sales_return', 'edit_sales_return', 'delete_sales_return', 'view_sales_return', 'show_sales_return', 'access_sales_return', 'access_sales_return_item']))

  // Quotation Router
  router.group(() => {
    router.get('/quotation/statistics', [QuotationsController, 'getStatistics'])
    router.get('/quotation', [QuotationsController, 'index'])
    router.post('/quotation', [QuotationsController, 'store'])
    router.get('/quotation/:id', [QuotationsController, 'show'])
    router.post('/quotation/:id', [QuotationsController, 'update'])
    router.delete('/quotation/:id', [QuotationsController, 'destroy'])
    router.patch('/quotation/approveQuotation/:id', [QuotationsController, 'approveQuotation'])
    router.patch('/quotation/rejectQuotation/:id', [QuotationsController, 'rejectQuotation'])
    router.get('/quotation/getQuotationDetails/:id', [QuotationsController, 'getQuotationDetails'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_quotation', 'edit_quotation', 'delete_quotation', 'create_quotation', 'approve_quotation', 'reject_quotation', 'show_quotation', 'access_quotation', 'access_quotation_item']))

  // Pegawai Router
  router.group(() => {
    router.get('/pegawai/countByStatus', [PegawaiController, 'countByStatus'])
    router.resource('pegawai', PegawaiController).apiOnly()
    router.get('/pegawai/getDepartemenByDivisiId/:id', [PegawaiController, 'getDepartemenByDivisiId'])
    router.get('/pegawai/getCabangByPerusahaanId/:id', [PegawaiController, 'getCabangByPerusahaanId'])
    router.post('/pegawai/update/:id', [PegawaiController, 'update'])
    router.delete('/pegawai/delete/:id', [PegawaiController, 'destroy'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['edit_pegawai', 'delete_pegawai', 'view_pegawai', 'create_pegawai', 'approve_pegawai', 'reject_pegawai', 'show_pegawai', 'access_pegawai']))

  // Menu Router
  router.group(() => {
    router.resource('menu-groups', MenuGroupsController).apiOnly()
    router.get('/menu-groups-all', [MenuGroupsController, 'getAll'])
    router.resource('menu-details', MenuDetailsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())

  // Jabatan Router
  router.group(() => {
    router.get('/jabatan/countPegawaiByJabatan', [JabatansController, 'countPegawaiByJabatan'])
    router.resource('jabatan', JabatansController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_jabatan', 'edit_jabatan', 'delete_jabatan', 'create_jabatan', 'approve_jabatan', 'reject_jabatan', 'show_jabatan', 'access_jabatan']))

  // Perusahaan Router
  router.group(() => {
    router.post('/perusahaan/:id', [PerusahaansController, 'update'])
    router.resource('perusahaan', PerusahaansController).except(['update']).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['edit_perusahaan', 'delete_perusahaan', 'view_perusahaan', 'create_perusahaan', 'approve_perusahaan', 'reject_perusahaan', 'show_perusahaan', 'access_perusahaan']))

  // Unit Router
  router.group(() => {
    router.resource('unit', UnitsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_unit', 'edit_unit', 'delete_unit', 'create_unit', 'approve_unit', 'reject_unit', 'show_unit', 'access_unit']))

  // Product Router
  router.group(() => {
    router.post('/product/:id', [ProductsController, 'update'])
    router.get('/product/totalProducts', [ProductsController, 'totalProducts'])
    router.get('/product/export-excel', [ProductsController, 'exportExcel'])
    router.resource('product', ProductsController).except(['update']).apiOnly()
    
    // Import routes
    router.post('/import/products-stocks', [ImportController, 'importProductsAndStocks'])
    router.get('/import/template', [ImportController, 'downloadTemplate'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_product', 'edit_product', 'delete_product', 'create_product', 'approve_product', 'reject_product', 'show_product', 'access_product']))

  // Customer Router
  router.group(() => {
    router.resource('customer', CustomersController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_customer', 'edit_customer', 'delete_customer', 'create_customer', 'approve_customer', 'reject_customer', 'show_customer', 'access_customer']))

  // Vendor Router
  router.group(() => {
    router.resource('vendor', VendorsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_vendor', 'edit_vendor', 'delete_vendor', 'create_vendor', 'approve_vendor', 'reject_vendor', 'show_vendor', 'access_vendor']))

  // Kategori Router
  router.group(() => {
    router.get('/categories/countProductByCategory', [CategoriesController, 'countProductByCategory'])
    router.resource('categories', CategoriesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_kategori', 'edit_kategori', 'delete_kategori', 'create_kategori', 'approve_kategori', 'reject_kategori', 'show_kategori', 'access_kategori']))

  // Cabang Router
  router.group(() => {
    router.resource('cabang', CabangsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_cabang', 'edit_cabang', 'delete_cabang', 'create_cabang', 'approve_cabang', 'reject_cabang', 'show_cabang', 'access_cabang']))

  // Divisi Router
  router.group(() => {
    router.resource('divisi', DivisisController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_divisi', 'edit_divisi', 'delete_divisi', 'create_divisi', 'approve_divisi', 'reject_divisi', 'show_divisi', 'access_divisi']))

  // Departemen Router
  router.group(() => {
    router.resource('departemen', DepartemenController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_departemen', 'edit_departemen', 'delete_departemen', 'create_departemen', 'approve_departemen', 'reject_departemen', 'show_departemen', 'access_departemen']))

  // Warehouse Router
  router.group(() => {
    router.get('/warehouse/getTotalWarehouse', [WarehousesController, 'getTotalWarehouse'])
    router.resource('warehouse', WarehousesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_gudang', 'edit_gudang', 'delete_gudang', 'create_gudang', 'approve_gudang', 'reject_gudang', 'show_gudang', 'access_gudang']))

  // Stock Router
  router.group(() => {
    router.get('/stock/getTotalStock', [StocksController, 'getTotalStock'])
    router.get('/stock/export-excel', [StocksController, 'exportExcel'])
    router.resource('stock', StocksController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_stock', 'edit_stock', 'delete_stock', 'create_stock', 'approve_stock', 'reject_stock', 'show_stock', 'access_stock']))

  // Stock In Router
  router.group(() => {
    router.post('/stock-in/postStockIn/:id', [StockInsController, 'postStockIn'])
    router.post('/stock-in/postAllStockIn', [StockInsController, 'postAllStockIn'])
    router.get('/stock-in/getTotalStockIn', [StockInsController, 'getTotalStockIn'])
    router.get('/stock-in/getStockInDetails/:id', [StockInsController, 'getStockInDetails'])
    router.get('/stock-in/export', [StockInsController, 'getAllForExport'])
    router.get('/stock-in/notifications', [StockInsController, 'getNotifications'])
    router.resource('stock-in', StockInsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_stock_in', 'edit_stock_in', 'delete_stock_in', 'create_stock_in', 'approve_stock_in', 'reject_stock_in', 'show_stock_in', 'access_stock_in']))

  // Stock Out Router
  router.group(() => {
    router.post('/stock-out/postStockOut/:id', [StockOutsController, 'postStockOut'])
    router.post('/stock-out/postAllStockOut', [StockOutsController, 'postAllStockOut'])
    router.get('/stock-out/getTotalStockOut', [StockOutsController, 'getTotalStockOut'])
    router.get('/stock-out/getStockOutDetails/:id', [StockOutsController, 'getStockOutDetails'])
    router.get('/stock-out/export', [StockOutsController, 'getAllForExport'])
    router.get('/stock-out/notifications', [StockOutsController, 'getNotifications'])
    router.resource('stock-out', StockOutsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_stock_out', 'edit_stock_out', 'delete_stock_out', 'create_stock_out', 'approve_stock_out', 'reject_stock_out', 'show_stock_out', 'access_stock_out']))

  // Stock Transfer Router
  router.group(() => {
    router.get('/stock-transfer/getTotalStockTransfer', [StockTransfersController, 'getTotalStockTransfer'])
    router.get('/stock-transfer/getStockTransferDetails/:id', [StockTransfersController, 'getStockTransferDetails'])
    router.get('/stock-transfer/cetakStockTransfer/:id', [StockTransfersController, 'getStockTransferDetails'])
    router.patch('/stock-transfer/approveStockTransfer/:id', [StockTransfersController, 'approveStockTransfer'])
    router.patch('/stock-transfer/rejectStockTransfer/:id', [StockTransfersController, 'rejectStockTransfer'])
    router.resource('stock-transfer', StockTransfersController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_stock_transfer', 'edit_stock_transfer', 'delete_stock_transfer', 'create_stock_transfer', 'approve_stock_transfer', 'reject_stock_transfer', 'show_stock_transfer', 'access_stock_transfer']))

  // Cuti Router
  router.group(() => {
    router.resource('cuti', CutisController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_cuti', 'edit_cuti', 'delete_cuti', 'create_cuti', 'approve_cuti', 'reject_cuti', 'show_cuti', 'access_cuti']))

  // Associations Router
  router.group(() => {
    router.get('/associations', [AssociationsController, 'index'])
  })
  .prefix('/api')
  .use(middleware.auth())

  // Data Access Router - untuk akses data tanpa permission menu
  router.group(() => {
    router.get('/data/perusahaan', [AssociationsController, 'getPerusahaanData'])
    router.get('/data/cabang', [AssociationsController, 'getCabangData'])
    router.get('/data/warehouse', [AssociationsController, 'getWarehouseData'])
    router.get('/data/product', [AssociationsController, 'getProductData'])
    router.get('/data/customer', [AssociationsController, 'getCustomerData'])
    router.get('/data/vendor', [AssociationsController, 'getVendorData'])
    router.get('/data/departemen', [AssociationsController, 'getDepartemenData'])
    router.get('/data/jabatan', [AssociationsController, 'getJabatanData'])
    router.get('/data/pegawai', [AssociationsController, 'getPegawaiData'])
    router.get('/data/sales-order', [AssociationsController, 'getSalesOrderData'])
    router.get('/data/sales-invoice', [AssociationsController, 'getSalesInvoiceData'])
    router.get('/data/surat-jalan', [AssociationsController, 'getSuratJalanData'])
    router.get('/data/sales-return', [AssociationsController, 'getSalesReturnData'])
    router.get('/data/quotation', [AssociationsController, 'getQuotationData'])
    router.get('/data/cuti', [AssociationsController, 'getCutiData'])
    router.get('/data/purchase-order', [AssociationsController, 'getPurchaseOrderData'])
    router.get('/data/purchase-invoice', [AssociationsController, 'getPurchaseInvoiceData'])
    router.get('/data/stock-in', [AssociationsController, 'getStockInData'])
    router.get('/data/stock-out', [AssociationsController, 'getStockOutData'])
    router.get('/data/stock-transfer', [AssociationsController, 'getStockTransferData'])
    router.get('/data/stock', [AssociationsController, 'getStockData'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['access_perusahaan', 'access_cabang', 'access_gudang', 'access_product', 'access_customer', 'access_vendor', 'access_departemen', 'access_jabatan', 'access_pegawai', 'access_jabatan', 'access_sales_order', 'access_sales_invoice', 'access_surat_jalan', 'access_sales_return', 'access_quotation', 'access_cuti', 'access_purchase_order', 'access_purchase_invoice', 'access_stock_in', 'access_stock_out', 'access_stock_transfer', 'access_stock']))

  // User Session Router - untuk monitoring user yang sedang online
  router.group(() => {
    router.get('/user-sessions/active-users', [UserSessionsController, 'getActiveUsers'])
    router.get('/user-sessions/user/:id/sessions', [UserSessionsController, 'getUserSessions'])
    router.post('/user-sessions/force-logout/:sessionId', [UserSessionsController, 'forceLogout'])
    router.post('/user-sessions/cleanup-expired', [UserSessionsController, 'cleanupExpired'])
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasRole(['superadmin', 'admin']))

  // Bank Accounts Router
  router.group(() => {
    router.resource('/accounting/bank-accounts', BankAccountsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_bank_account', 'edit_bank_account', 'delete_bank_account', 'create_bank_account', 'show_bank_account', 'approve_bank_account', 'reject_bank_account', 'access_bank_account']))

  // Taxes Router
  router.group(() => {
    router.get('/accounting/taxes/active', [TaxesController, 'getActive'])
    router.resource('/accounting/taxes', TaxesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_tax', 'edit_tax', 'delete_tax', 'create_tax', 'show_tax', 'approve_tax', 'reject_tax', 'access_tax']))

  // Expenses Router
  router.group(() => {
    router.get('/accounting/expenses/summary', [ExpensesController, 'getSummary'])
    router.resource('/accounting/expenses', ExpensesController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_expenses', 'edit_expenses', 'delete_expenses', 'create_expenses', 'show_expenses', 'approve_expenses', 'reject_expenses', 'access_expenses']))

  // AP Payments Router (Pembayaran Hutang)
  router.group(() => {
    router.get('/accounting/ap-payments/summary', [ApPaymentsController, 'getSummary'])
    router.resource('/accounting/ap-payments', ApPaymentsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_ap_payment', 'edit_ap_payment', 'delete_ap_payment', 'create_ap_payment', 'show_ap_payment', 'approve_ap_payment', 'reject_ap_payment', 'access_ap_payment']))

  // AR Receipts Router (Penerimaan Piutang)
  router.group(() => {
    router.get('/accounting/ar-receipts/summary', [ArReceiptsController, 'getSummary'])
    router.resource('/accounting/ar-receipts', ArReceiptsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_ar_receipt', 'edit_ar_receipt', 'delete_ar_receipt', 'create_ar_receipt', 'show_ar_receipt', 'approve_ar_receipt', 'reject_ar_receipt', 'access_ar_receipt']))

  // Assets Router
  router.group(() => {
    router.get('/accounting/assets/categories', [AssetsController, 'getCategories'])
    router.get('/accounting/assets/summary', [AssetsController, 'getSummary'])
    router.get('/accounting/assets/:id/calculate-depreciation', [AssetsController, 'calculateDepreciation'])
    router.resource('/accounting/assets', AssetsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_asset', 'edit_asset', 'delete_asset', 'create_asset', 'show_asset', 'approve_asset', 'reject_asset', 'access_asset']))

  // Accounts Router (Chart of Accounts)
  router.group(() => {
    router.get('/accounting/accounts/chart-of-accounts', [AccountsController, 'getChartOfAccounts'])
    router.get('/accounting/accounts/category/:category', [AccountsController, 'getByCategory'])
    router.get('/accounting/accounts/parent-accounts', [AccountsController, 'getParentAccounts'])
    router.get('/accounting/accounts/summary', [AccountsController, 'getSummary'])
    router.resource('/accounting/accounts', AccountsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_account', 'edit_account', 'delete_account', 'create_account', 'show_account', 'approve_account', 'reject_account', 'access_account']))

  // Journals Router
  router.group(() => {
    router.get('/accounting/journals/summary', [JournalsController, 'getSummary'])
    router.get('/accounting/journals/trial-balance', [JournalsController, 'getTrialBalance'])
    router.get('/accounting/journals/generate-number', [JournalsController, 'generateJournalNumber'])
    router.patch('/accounting/journals/:id/post', [JournalsController, 'post'])
    router.patch('/accounting/journals/:id/cancel', [JournalsController, 'cancel'])
    router.resource('/accounting/journals', JournalsController).apiOnly()
  })
  .prefix('/api')
  .use(middleware.auth())
  .use(middleware.hasPermission(['view_journal', 'edit_journal', 'delete_journal', 'create_journal', 'show_journal', 'post_journal', 'cancel_journal', 'approve_journal', 'reject_journal', 'access_journal']))
