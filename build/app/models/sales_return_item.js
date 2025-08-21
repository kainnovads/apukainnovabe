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
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm';
import SalesReturn from '#models/sales_return';
import Product from '#models/product';
import { randomUUID } from 'node:crypto';
import Warehouse from '#models/warehouse';
import SalesOrderItem from '#models/sales_order_item';
export default class SalesReturnItem extends BaseModel {
    static table = 'sales_return_items';
    static assignUuid(sri) {
        sri.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "salesReturnId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "salesOrderItemId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesReturnItem.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "reason", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesReturnItem.prototype, "description", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesReturnItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesReturnItem.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => SalesReturn),
    __metadata("design:type", Object)
], SalesReturnItem.prototype, "salesReturn", void 0);
__decorate([
    belongsTo(() => SalesOrderItem),
    __metadata("design:type", Object)
], SalesReturnItem.prototype, "salesOrderItem", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], SalesReturnItem.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], SalesReturnItem.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesReturnItem]),
    __metadata("design:returntype", void 0)
], SalesReturnItem, "assignUuid", null);
//# sourceMappingURL=sales_return_item.js.map