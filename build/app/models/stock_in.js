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
import StockInDetail from '#models/stock_in_detail';
import Stock from '#models/stock';
import User from '#models/auth/user';
import PurchaseOrder from '#models/purchase_order';
import Warehouse from '#models/warehouse';
import { randomUUID } from 'node:crypto';
export default class StockIn extends BaseModel {
    static assignUuid(stockIn) {
        stockIn.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], StockIn.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], StockIn.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], StockIn.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockIn.prototype, "noSi", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], StockIn.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], StockIn.prototype, "postedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockIn.prototype, "purchaseOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockIn.prototype, "warehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockIn.prototype, "quantity", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockIn.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockIn.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockIn.prototype, "postedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockIn.prototype, "receivedBy", void 0);
__decorate([
    hasMany(() => StockInDetail),
    __metadata("design:type", Object)
], StockIn.prototype, "stockInDetails", void 0);
__decorate([
    belongsTo(() => PurchaseOrder, {
        foreignKey: 'purchaseOrderId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockIn.prototype, "purchaseOrder", void 0);
__decorate([
    belongsTo(() => User),
    __metadata("design:type", Object)
], StockIn.prototype, "user", void 0);
__decorate([
    belongsTo(() => Stock, {
        foreignKey: 'stockId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockIn.prototype, "stock", void 0);
__decorate([
    belongsTo(() => Warehouse),
    __metadata("design:type", Object)
], StockIn.prototype, "warehouse", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'postedBy',
    }),
    __metadata("design:type", Object)
], StockIn.prototype, "postedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'receivedBy',
    }),
    __metadata("design:type", Object)
], StockIn.prototype, "receivedByUser", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StockIn]),
    __metadata("design:returntype", void 0)
], StockIn, "assignUuid", null);
//# sourceMappingURL=stock_in.js.map