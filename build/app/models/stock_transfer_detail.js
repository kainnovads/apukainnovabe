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
import StockTransfer from '#models/stock_transfer';
import Product from '#models/product';
export default class StockTransferDetail extends BaseModel {
    static assignUuid(stockTransferDetail) {
        stockTransferDetail.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], StockTransferDetail.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], StockTransferDetail.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], StockTransferDetail.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransferDetail.prototype, "stockTransferId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransferDetail.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransferDetail.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransferDetail.prototype, "description", void 0);
__decorate([
    belongsTo(() => StockTransfer),
    __metadata("design:type", Object)
], StockTransferDetail.prototype, "stockTransfer", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], StockTransferDetail.prototype, "product", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StockTransferDetail]),
    __metadata("design:returntype", void 0)
], StockTransferDetail, "assignUuid", null);
//# sourceMappingURL=stock_transfer_detail.js.map