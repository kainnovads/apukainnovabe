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
import SuratJalanItem from '#models/surat_jalan_item';
import Customer from '#models/customer';
import { randomUUID } from 'node:crypto';
import User from '#models/auth/user';
export default class SuratJalan extends BaseModel {
    static assignUuid(suratJalan) {
        suratJalan.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], SuratJalan.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], SuratJalan.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], SuratJalan.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "noSuratJalan", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "salesOrderId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], SuratJalan.prototype, "customerId", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], SuratJalan.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "picName", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "penerima", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SuratJalan.prototype, "createdBy", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], SuratJalan.prototype, "total", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], SuratJalan.prototype, "alamatPengiriman", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'createdBy',
    }),
    __metadata("design:type", Object)
], SuratJalan.prototype, "createdByUser", void 0);
__decorate([
    belongsTo(() => SalesOrder),
    __metadata("design:type", Object)
], SuratJalan.prototype, "salesOrder", void 0);
__decorate([
    belongsTo(() => Customer),
    __metadata("design:type", Object)
], SuratJalan.prototype, "customer", void 0);
__decorate([
    hasMany(() => SuratJalanItem),
    __metadata("design:type", Object)
], SuratJalan.prototype, "suratJalanItems", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SuratJalan]),
    __metadata("design:returntype", void 0)
], SuratJalan, "assignUuid", null);
//# sourceMappingURL=surat_jalan.js.map