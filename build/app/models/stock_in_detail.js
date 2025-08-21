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
import Product from '#models/product';
import StockIn from '#models/stock_in';
import { randomUUID } from 'node:crypto';
export default class StockInDetail extends BaseModel {
    static assignUuid(stockInDetail) {
        stockInDetail.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], StockInDetail.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], StockInDetail.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], StockInDetail.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockInDetail.prototype, "stockInId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockInDetail.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockInDetail.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockInDetail.prototype, "description", void 0);
__decorate([
    belongsTo(() => StockIn),
    __metadata("design:type", Object)
], StockInDetail.prototype, "stockIn", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], StockInDetail.prototype, "product", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StockInDetail]),
    __metadata("design:returntype", void 0)
], StockInDetail, "assignUuid", null);
//# sourceMappingURL=stock_in_detail.js.map