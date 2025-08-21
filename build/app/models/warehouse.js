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
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm';
import Stock from '#models/stock';
import StockIn from '#models/stock_in';
import StockOut from '#models/stock_out';
import PurchaseOrderItem from '#models/purchase_order_item';
import SalesOrderItem from '#models/sales_order_item';
import SalesReturnItem from '#models/sales_return_item';
export default class Warehouse extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Warehouse.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Warehouse.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Warehouse.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Warehouse.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Warehouse.prototype, "code", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Warehouse.prototype, "address", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Warehouse.prototype, "phone", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Warehouse.prototype, "email", void 0);
__decorate([
    hasMany(() => Stock),
    __metadata("design:type", Object)
], Warehouse.prototype, "stocks", void 0);
__decorate([
    hasMany(() => StockIn),
    __metadata("design:type", Object)
], Warehouse.prototype, "stockIns", void 0);
__decorate([
    hasMany(() => StockOut),
    __metadata("design:type", Object)
], Warehouse.prototype, "stockOuts", void 0);
__decorate([
    hasMany(() => PurchaseOrderItem),
    __metadata("design:type", Object)
], Warehouse.prototype, "purchaseOrderItems", void 0);
__decorate([
    hasMany(() => SalesOrderItem),
    __metadata("design:type", Object)
], Warehouse.prototype, "salesOrderItems", void 0);
__decorate([
    hasMany(() => SalesReturnItem),
    __metadata("design:type", Object)
], Warehouse.prototype, "salesReturnItems", void 0);
//# sourceMappingURL=warehouse.js.map