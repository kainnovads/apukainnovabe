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
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm';
import SalesInvoice from '#models/sales_invoice';
import SalesOrderItem from '#models/sales_order_item';
import Product from '#models/product';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class SalesInvoiceItem extends BaseModel {
    static assignUuid(item) {
        item.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SalesInvoiceItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SalesInvoiceItem.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SalesInvoiceItem.prototype, "salesInvoiceId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "salesOrderItemId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "subtotal", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SalesInvoiceItem.prototype, "deliveredQty", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], SalesInvoiceItem.prototype, "isReturned", void 0);
__decorate([
    belongsTo(() => SalesInvoice),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "salesInvoice", void 0);
__decorate([
    belongsTo(() => SalesOrderItem),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "salesOrderItem", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], SalesInvoiceItem.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SalesInvoiceItem]),
    __metadata("design:returntype", void 0)
], SalesInvoiceItem, "assignUuid", null);
//# sourceMappingURL=sales_invoice_item.js.map