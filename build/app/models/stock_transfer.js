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
import { randomUUID } from 'node:crypto';
import StockTransferDetail from '#models/stock_transfer_detail';
import Warehouse from '#models/warehouse';
import User from '#models/auth/user';
import Perusahaan from '#models/perusahaan';
import Cabang from '#models/cabang';
export default class StockTransfer extends BaseModel {
    static assignUuid(stockTransfer) {
        stockTransfer.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], StockTransfer.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransfer.prototype, "noTransfer", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransfer.prototype, "penerima", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "perusahaanId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "cabangId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "fromWarehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "toWarehouseId", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], StockTransfer.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "transferBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "approvedBy", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransfer.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], StockTransfer.prototype, "status", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], StockTransfer.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], StockTransfer.prototype, "updatedAt", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], StockTransfer.prototype, "approvedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], StockTransfer.prototype, "rejectedBy", void 0);
__decorate([
    column.dateTime(),
    __metadata("design:type", DateTime)
], StockTransfer.prototype, "rejectedAt", void 0);
__decorate([
    hasMany(() => StockTransferDetail),
    __metadata("design:type", Object)
], StockTransfer.prototype, "stockTransferDetails", void 0);
__decorate([
    belongsTo(() => Perusahaan, {
        foreignKey: 'perusahaanId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "perusahaan", void 0);
__decorate([
    belongsTo(() => Cabang, {
        foreignKey: 'cabangId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "cabang", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'transferBy',
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "transferByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'approvedBy',
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "approvedByUser", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'rejectedBy',
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "rejectedByUser", void 0);
__decorate([
    belongsTo(() => Warehouse, {
        foreignKey: 'fromWarehouseId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "fromWarehouse", void 0);
__decorate([
    belongsTo(() => Warehouse, {
        foreignKey: 'toWarehouseId',
        localKey: 'id'
    }),
    __metadata("design:type", Object)
], StockTransfer.prototype, "toWarehouse", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StockTransfer]),
    __metadata("design:returntype", void 0)
], StockTransfer, "assignUuid", null);
//# sourceMappingURL=stock_transfer.js.map