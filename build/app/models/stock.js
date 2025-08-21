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
import StockIn from '#models/stock_in';
import StockOut from '#models/stock_out';
import Product from '#models/product';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class Stock extends BaseModel {
    static assignUuid(stock) {
        stock.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], Stock.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Stock.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Stock.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Stock.prototype, "productId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Stock.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Stock.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Stock.prototype, "description", void 0);
__decorate([
    hasMany(() => StockIn),
    __metadata("design:type", Object)
], Stock.prototype, "stockIns", void 0);
__decorate([
    hasMany(() => StockOut),
    __metadata("design:type", Object)
], Stock.prototype, "stockOuts", void 0);
__decorate([
    belongsTo(() => Product),
    __metadata("design:type", Object)
], Stock.prototype, "product", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], Stock.prototype, "warehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Stock]),
    __metadata("design:returntype", void 0)
], Stock, "assignUuid", null);
//# sourceMappingURL=stock.js.map