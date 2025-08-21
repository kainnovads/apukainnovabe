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
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import SalesOrder from '#models/sales_order';
import Product from '#models/product';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
import SalesReturnItem from '#models/sales_return_item';
export default class SalesOrderItem extends BaseModel {
    static assignUuid(soi) {
        soi.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesOrderItem.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesOrderItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesOrderItem.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrderItem.prototype, "salesOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "deliveredQty", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "subtotal", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesOrderItem.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], SalesOrderItem.prototype, "statusPartial", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesOrderItem.prototype, "description", void 0);
__decorate([
    belongsTo(() => SalesOrder),
    __metadata("design:type", Object)
], SalesOrderItem.prototype, "salesOrder", void 0);
__decorate([
    hasMany(() => SalesReturnItem, {
        foreignKey: 'salesOrderItemId',
    }),
    __metadata("design:type", Object)
], SalesOrderItem.prototype, "salesReturnItems", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], SalesOrderItem.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], SalesOrderItem.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesOrderItem]),
    __metadata("design:returntype", void 0)
], SalesOrderItem, "assignUuid", null);
//# sourceMappingURL=sales_order_item.js.map