import router from '@adonisjs/core/services/router';
import { middleware } from '#start/kernel';
import CategoriesController from '#controllers/categories_controller';
import UnitsController from '#controllers/units_controller';
import CutisController from '#controllers/cutis_controller';
import DepartemenController from '#controllers/departemen_controller';
import DivisisController from '#controllers/divisis_controller';
import JabatansController from '#controllers/jabatans_controller';
import PegawaiController from '#controllers/pegawai_controller';
import CabangsController from '#controllers/cabangs_controller';
import PerusahaansController from '#controllers/perusahaans_controller';
import AuthController from '#controllers/Http/auth_controller';
import RolesController from '#controllers/Http/roles_controller';
import MenuGroupsController from '#controllers/menu_groups_controller';
import MenuDetailsController from '#controllers/menu_details_controller';
import PermissionsController from '#controllers/Http/permissions_controller';
import UsersController from '#controllers/Http/users_controller';
import WarehousesController from '#controllers/warehouses_controller';
import ProductsController from '#controllers/products_controller';
import VendorsController from '#controllers/vendors_controller';
import CustomersController from '#controllers/customers_controller';
import PurchasesController from '#controllers/purchases_controller';
import PurchaseItemsController from '#controllers/purchase_items_controller';
import StocksController from '#controllers/stocks_controller';
import StockInsController from '#controllers/stock_ins_controller';
import StockOutsController from '#controllers/stock_outs_controller';
import SalesOrdersController from '#controllers/sales_controller';
import SalesItemsController from '#controllers/sales_items_controller';
import SalesReturnsController from '#controllers/sales_returns_controller';
import StockTransfersController from '#controllers/stock_transfers_controller';
import AssociationsController from '#controllers/associations_controller';
import SalesInvoicesController from '#controllers/sales_invoices_controller';
import SuratJalansController from '#controllers/surat_jalans_controller';
import QuotationsController from '#controllers/quotations_controller';
import UserSessionsController from '#controllers/user_sessions_controller';
router.get('/', async () => {
    return { message: 'Welcome to your API! Get your CSRF token here.' };
});
router.get('/health', async () => {
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown'
    };
});
router.get('/auth/api/csrf-token', async ({ response, request }) => {
    return response.ok({ token: request.csrfToken });
});
router
    .group(() => {
    router.get('/sales-order/countByStatus', [SalesOrdersController, 'countByStatus']);
    router.get('/sales-order/statistics', [SalesOrdersController, 'getSalesStatistics']);
    router.get('/sales-order/salesByCustomer', [SalesOrdersController, 'getSalesByCustomer']);
})
    .prefix('/api')
    .use(middleware.auth());
router
    .group(() => {
    router.post('/register', [AuthController, 'register']);
    router.post('/login', [AuthController, 'login']);
    router.post('/refresh-token', [AuthController, 'refreshToken']);
    router.get('/me', [AuthController, 'me']).use(middleware.auth({ guards: ['api'] }));
    router.post('/logout', [AuthController, 'logout']).use(middleware.auth());
})
    .prefix('/auth/api');
router
    .group(() => {
    router.get('/users/countTotalUsers', [UsersController, 'countTotalUsers']);
    router.resource('users', UsersController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasRole(['superadmin']));
router.group(() => {
    router.get('/roles', [RolesController, 'index']);
    router.post('/roles/store', [RolesController, 'store']);
    router.put('/roles/update/:id', [RolesController, 'update']);
    router.get('/roles/:id', [RolesController, 'show']);
    router.delete('/roles/delete/:id', [RolesController, 'destroy']);
    router.get('/getPermissions', [RolesController, 'getPermissions']);
    router.get('/permissions/getTotalPermission', [PermissionsController, 'getTotalPermission']);
    router.resource('permissions', PermissionsController).apiOnly();
    router.get('/permissions/getMenuGroupDetails/:id', [PermissionsController, 'getMenuGroupDetails']);
    router.post('/permissions/batch', [PermissionsController, 'storeBatch']);
    router.post('/stock/validate-batch', [StocksController, 'validateStockBatch']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasRole(['superadmin', 'admin']));
router.group(() => {
    router.patch('/purchase-order/approvePurchaseOrder/:id', [PurchasesController, 'approvePurchaseOrder']);
    router.patch('/purchase-order/rejectPurchaseOrder/:id', [PurchasesController, 'rejectPurchaseOrder']);
    router.post('/purchase-order/:id', [PurchasesController, 'update']);
    router.get('/purchase-order/getPurchaseOrderDetails/:id', [PurchasesController, 'getPurchaseOrderDetails']);
    router.resource('purchase-order', PurchasesController).except(['update']).apiOnly();
    router.patch('/purchase-order-item/updateStatusPartial/:id', [PurchaseItemsController, 'updateStatusPartial']);
    router.post('/purchase-order/receiveAllItems/:id', [PurchaseItemsController, 'receiveAllItems']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['approve_purchase_order', 'reject_purchase_order', 'edit_purchase_order', 'delete_purchase_order', 'view_purchase_order', 'approve_purchase_order_item', 'reject_purchase_order_item', 'edit_purchase_order_item', 'delete_purchase_order_item', 'view_purchase_order_item', 'show_purchase_order']));
router.group(() => {
    router.patch('/sales-order/approveSalesOrder/:id', [SalesOrdersController, 'approveSalesOrder']);
    router.patch('/sales-order/rejectSalesOrder/:id', [SalesOrdersController, 'rejectSalesOrder']);
    router.post('/sales-order/:id', [SalesOrdersController, 'update']);
    router.get('/sales-order/getSalesOrderDetails/:id', [SalesOrdersController, 'getSalesOrderDetails']);
    router.resource('sales-order', SalesOrdersController).except(['update']).apiOnly();
    router.patch('/sales-order-item/updateStatusPartial/:id', [SalesItemsController, 'updateStatusPartial']);
    router.post('/sales-order/deliverAllItems/:id', [SalesItemsController, 'deliverAllItems']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['approve_sales_order', 'reject_sales_order', 'edit_sales_order', 'delete_sales_order', 'view_sales_order', 'approve_sales_order_item', 'reject_sales_order_item', 'edit_sales_order_item', 'delete_sales_order_item', 'view_sales_order_item', 'show_sales_order']));
router.group(() => {
    router.resource('sales-invoices', SalesInvoicesController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_sales_invoice', 'edit_sales_invoice', 'delete_sales_invoice', 'create_sales_invoice', 'approve_sales_invoice', 'reject_sales_invoice', 'show_sales_invoice']));
router.group(() => {
    router.resource('surat-jalan', SuratJalansController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_surat_jalan', 'edit_surat_jalan', 'delete_surat_jalan', 'create_surat_jalan', 'approve_surat_jalan', 'reject_surat_jalan', 'show_surat_jalan']));
router.group(() => {
    router.get('/sales-return/get-sales-order/:id', [SalesReturnsController, 'getSalesOrder']);
    router.post('/sales-return/:id', [SalesReturnsController, 'update']);
    router.patch('/sales-return/approveSalesReturn/:id', [SalesReturnsController, 'approveSalesReturn']);
    router.patch('/sales-return/rejectSalesReturn/:id', [SalesReturnsController, 'rejectSalesReturn']);
    router.resource('sales-return', SalesReturnsController).except(['update']).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['approve_sales_return', 'reject_sales_return', 'edit_sales_return', 'delete_sales_return', 'view_sales_return', 'show_sales_return']));
router.group(() => {
    router.get('/quotation', [QuotationsController, 'index']);
    router.post('/quotation', [QuotationsController, 'store']);
    router.get('/quotation/:id', [QuotationsController, 'show']);
    router.post('/quotation/:id', [QuotationsController, 'update']);
    router.delete('/quotation/:id', [QuotationsController, 'destroy']);
    router.patch('/quotation/approveQuotation/:id', [QuotationsController, 'approveQuotation']);
    router.patch('/quotation/rejectQuotation/:id', [QuotationsController, 'rejectQuotation']);
    router.get('/quotation/getQuotationDetails/:id', [QuotationsController, 'getQuotationDetails']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_quotation', 'edit_quotation', 'delete_quotation', 'create_quotation', 'approve_quotation', 'reject_quotation', 'show_quotation']));
router.group(() => {
    router.get('/pegawai/countByStatus', [PegawaiController, 'countByStatus']);
    router.resource('pegawai', PegawaiController).apiOnly();
    router.get('/pegawai/getDepartemenByDivisiId/:id', [PegawaiController, 'getDepartemenByDivisiId']);
    router.get('/pegawai/getCabangByPerusahaanId/:id', [PegawaiController, 'getCabangByPerusahaanId']);
    router.post('/pegawai/update/:id', [PegawaiController, 'update']);
    router.delete('/pegawai/delete/:id', [PegawaiController, 'destroy']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['edit_pegawai', 'delete_pegawai', 'view_pegawai', 'create_pegawai', 'approve_pegawai', 'reject_pegawai', 'show_pegawai']));
router.group(() => {
    router.resource('menu-groups', MenuGroupsController).apiOnly();
    router.get('/menu-groups-all', [MenuGroupsController, 'getAll']);
    router.resource('menu-details', MenuDetailsController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth());
router.group(() => {
    router.get('/jabatan/countPegawaiByJabatan', [JabatansController, 'countPegawaiByJabatan']);
    router.resource('jabatan', JabatansController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_jabatan', 'edit_jabatan', 'delete_jabatan', 'create_jabatan', 'approve_jabatan', 'reject_jabatan', 'show_jabatan']));
router.group(() => {
    router.post('/perusahaan/:id', [PerusahaansController, 'update']);
    router.resource('perusahaan', PerusahaansController).except(['update']).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['edit_perusahaan', 'delete_perusahaan', 'view_perusahaan', 'create_perusahaan', 'approve_perusahaan', 'reject_perusahaan', 'show_perusahaan']));
router.group(() => {
    router.resource('unit', UnitsController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_unit', 'edit_unit', 'delete_unit', 'create_unit', 'approve_unit', 'reject_unit', 'show_unit']));
router.group(() => {
    router.post('/product/:id', [ProductsController, 'update']);
    router.resource('product', ProductsController).except(['update']).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_product', 'edit_product', 'delete_product', 'create_product', 'approve_product', 'reject_product', 'show_product']));
router.group(() => {
    router.post('/customer/:id', [CustomersController, 'update']);
    router.resource('customer', CustomersController).except(['update']).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_customer', 'edit_customer', 'delete_customer', 'create_customer', 'approve_customer', 'reject_customer', 'show_customer']));
router.group(() => {
    router.post('/vendor/:id', [VendorsController, 'update']);
    router.resource('vendor', VendorsController).except(['update']).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_vendor', 'edit_vendor', 'delete_vendor', 'create_vendor', 'approve_vendor', 'reject_vendor', 'show_vendor']));
router.group(() => {
    router.get('/categories/countProductByCategory', [CategoriesController, 'countProductByCategory']);
    router.resource('categories', CategoriesController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_kategori', 'edit_kategori', 'delete_kategori', 'create_kategori', 'approve_kategori', 'reject_kategori', 'show_kategori']));
router.group(() => {
    router.resource('cabang', CabangsController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_cabang', 'edit_cabang', 'delete_cabang', 'create_cabang', 'approve_cabang', 'reject_cabang', 'show_cabang']));
router.group(() => {
    router.resource('divisi', DivisisController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_divisi', 'edit_divisi', 'delete_divisi', 'create_divisi', 'approve_divisi', 'reject_divisi', 'show_divisi']));
router.group(() => {
    router.resource('departemen', DepartemenController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_departemen', 'edit_departemen', 'delete_departemen', 'create_departemen', 'approve_departemen', 'reject_departemen', 'show_departemen']));
router.group(() => {
    router.get('/warehouse/getTotalWarehouse', [WarehousesController, 'getTotalWarehouse']);
    router.resource('warehouse', WarehousesController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_gudang', 'edit_gudang', 'delete_gudang', 'create_gudang', 'approve_gudang', 'reject_gudang', 'show_gudang']));
router.group(() => {
    router.get('/stock/getTotalStock', [StocksController, 'getTotalStock']);
    router.resource('stock', StocksController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_stock', 'edit_stock', 'delete_stock', 'create_stock', 'approve_stock', 'reject_stock', 'show_stock']));
router.group(() => {
    router.post('/stock-in/postStockIn/:id', [StockInsController, 'postStockIn']);
    router.get('/stock-in/getTotalStockIn', [StockInsController, 'getTotalStockIn']);
    router.get('/stock-in/getStockInDetails/:id', [StockInsController, 'getStockInDetails']);
    router.get('/stock-in/export', [StockInsController, 'getAllForExport']);
    router.resource('stock-in', StockInsController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_stock_in', 'edit_stock_in', 'delete_stock_in', 'create_stock_in', 'approve_stock_in', 'reject_stock_in', 'show_stock_in']));
router.group(() => {
    router.post('/stock-out/postStockOut/:id', [StockOutsController, 'postStockOut']);
    router.get('/stock-out/getTotalStockOut', [StockOutsController, 'getTotalStockOut']);
    router.get('/stock-out/getStockOutDetails/:id', [StockOutsController, 'getStockOutDetails']);
    router.get('/stock-out/export', [StockOutsController, 'getAllForExport']);
    router.resource('stock-out', StockOutsController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_stock_out', 'edit_stock_out', 'delete_stock_out', 'create_stock_out', 'approve_stock_out', 'reject_stock_out', 'show_stock_out']));
router.group(() => {
    router.get('/stock-transfer/getTotalStockTransfer', [StockTransfersController, 'getTotalStockTransfer']);
    router.get('/stock-transfer/getStockTransferDetails/:id', [StockTransfersController, 'getStockTransferDetails']);
    router.get('/stock-transfer/cetakStockTransfer/:id', [StockTransfersController, 'getStockTransferDetails']);
    router.patch('/stock-transfer/approveStockTransfer/:id', [StockTransfersController, 'approveStockTransfer']);
    router.patch('/stock-transfer/rejectStockTransfer/:id', [StockTransfersController, 'rejectStockTransfer']);
    router.resource('stock-transfer', StockTransfersController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_stock_transfer', 'edit_stock_transfer', 'delete_stock_transfer', 'create_stock_transfer', 'approve_stock_transfer', 'reject_stock_transfer', 'show_stock_transfer']));
router.group(() => {
    router.resource('cuti', CutisController).apiOnly();
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['view_cuti', 'edit_cuti', 'delete_cuti', 'create_cuti', 'approve_cuti', 'reject_cuti', 'show_cuti']));
router.group(() => {
    router.get('/associations', [AssociationsController, 'index']);
})
    .prefix('/api')
    .use(middleware.auth());
router.group(() => {
    router.get('/data/perusahaan', [AssociationsController, 'getPerusahaanData']);
    router.get('/data/cabang', [AssociationsController, 'getCabangData']);
    router.get('/data/warehouse', [AssociationsController, 'getWarehouseData']);
    router.get('/data/product', [AssociationsController, 'getProductData']);
    router.get('/data/customer', [AssociationsController, 'getCustomerData']);
    router.get('/data/vendor', [AssociationsController, 'getVendorData']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasPermission(['access_perusahaan', 'access_cabang', 'access_warehouse', 'access_product', 'access_customer', 'access_vendor']));
router.group(() => {
    router.get('/user-sessions/active-users', [UserSessionsController, 'getActiveUsers']);
    router.get('/user-sessions/user/:id/sessions', [UserSessionsController, 'getUserSessions']);
    router.post('/user-sessions/force-logout/:sessionId', [UserSessionsController, 'forceLogout']);
    router.post('/user-sessions/cleanup-expired', [UserSessionsController, 'cleanupExpired']);
})
    .prefix('/api')
    .use(middleware.auth())
    .use(middleware.hasRole(['superadmin', 'admin']));
//# sourceMappingURL=routes.js.map