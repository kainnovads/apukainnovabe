var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DateTime } from 'luxon';
import { compose } from '@adonisjs/core/helpers';
import { column, BaseModel, manyToMany, hasOne, hasMany } from '@adonisjs/lucid/orm';
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid';
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens';
import AccessToken from '#models/auth/auth_access_token';
import hash from '@adonisjs/core/services/hash';
import Role from '#models/auth/role';
import Pegawai from '#models/pegawai';
import PurchaseOrder from '#models/purchase_order';
import SalesOrder from '#models/sales_order';
import StockIn from '#models/stock_in';
import StockOut from '#models/stock_out';
import StockTransfer from '#models/stock_transfer';
import SalesReturn from '#models/sales_return';
import SuratJalan from '#models/surat_jalan';
import Quotation from '#models/quotation';
const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
    uids: ['email'],
    passwordColumnName: 'password',
});
export default class User extends compose(BaseModel, AuthFinder) {
    static accessTokens = DbAccessTokensProvider.forModel(User);
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    column({ columnName: 'full_name' }),
    __metadata("design:type", Object)
], User.prototype, "fullName", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    column({ serializeAs: null }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    column({ columnName: 'isActive' }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], User.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", Object)
], User.prototype, "updatedAt", void 0);
__decorate([
    manyToMany(() => Role, {
        pivotTable: 'role_user',
    }),
    __metadata("design:type", Object)
], User.prototype, "roles", void 0);
__decorate([
    hasOne(() => Pegawai),
    __metadata("design:type", Object)
], User.prototype, "pegawai", void 0);
__decorate([
    hasMany(() => PurchaseOrder, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "createdPurchaseOrders", void 0);
__decorate([
    hasMany(() => PurchaseOrder, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "approvedPurchaseOrders", void 0);
__decorate([
    hasMany(() => PurchaseOrder, {
        foreignKey: 'receivedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "receivedPurchaseOrders", void 0);
__decorate([
    hasMany(() => PurchaseOrder, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "rejectedPurchaseOrders", void 0);
__decorate([
    hasMany(() => SalesOrder, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "createdSalesOrders", void 0);
__decorate([
    hasMany(() => SalesOrder, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "approvedSalesOrders", void 0);
__decorate([
    hasMany(() => SalesOrder, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "rejectedSalesOrders", void 0);
__decorate([
    hasMany(() => SalesOrder, {
        foreignKey: 'deliveredBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "deliveredSalesOrders", void 0);
__decorate([
    hasMany(() => StockIn, {
        foreignKey: 'postedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "postedStockIns", void 0);
__decorate([
    hasMany(() => StockIn, {
        foreignKey: 'receivedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "receivedStockIns", void 0);
__decorate([
    hasMany(() => StockOut, {
        foreignKey: 'deliveredBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "deliveredStockOuts", void 0);
__decorate([
    hasMany(() => StockOut, {
        foreignKey: 'postedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "postedStockOuts", void 0);
__decorate([
    hasMany(() => StockTransfer, {
        foreignKey: 'transferBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "transferByUser", void 0);
__decorate([
    hasMany(() => StockTransfer, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "approvedStockTransfers", void 0);
__decorate([
    hasMany(() => StockTransfer, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "rejectedStockTransfers", void 0);
__decorate([
    hasMany(() => AccessToken),
    __metadata("design:type", Object)
], User.prototype, "accessTokens", void 0);
__decorate([
    hasMany(() => SalesReturn, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "createdSalesReturns", void 0);
__decorate([
    hasMany(() => SalesReturn, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "approvedSalesReturns", void 0);
__decorate([
    hasMany(() => SalesReturn, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "rejectedSalesReturns", void 0);
__decorate([
    hasMany(() => SuratJalan, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "createdSuratJalans", void 0);
__decorate([
    hasMany(() => Quotation, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "createdQuotations", void 0);
__decorate([
    hasMany(() => Quotation, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "approvedQuotations", void 0);
__decorate([
    hasMany(() => Quotation, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], User.prototype, "rejectedQuotations", void 0);
//# sourceMappingURL=user.js.map