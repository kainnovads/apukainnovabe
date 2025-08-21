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
import { randomUUID } from 'node:crypto';
import Quotation from '#models/quotation';
import Product from '#models/product';
export default class QuotationItem extends BaseModel {
    static table = 'quotation_items';
    static assignUuid(quotationItem) {
        quotationItem.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], QuotationItem.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], QuotationItem.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], QuotationItem.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], QuotationItem.prototype, "quotationId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], QuotationItem.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], QuotationItem.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], QuotationItem.prototype, "price", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], QuotationItem.prototype, "subtotal", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], QuotationItem.prototype, "description", void 0);
__decorate([
    belongsTo(() => Quotation),
    __metadata("design:type", Object)
], QuotationItem.prototype, "quotation", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], QuotationItem.prototype, "product", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [QuotationItem]),
    __metadata("design:returntype", void 0)
], QuotationItem, "assignUuid", null);
//# sourceMappingURL=quotation_item.js.map