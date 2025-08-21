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
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm';
import Pegawai from '#models/pegawai';
import CutiType from '#models/cuti_type';
export default class Cuti extends BaseModel {
    static table = 'cuti';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Cuti.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Cuti.prototype, "cutiTypeId", void 0);
__decorate([
    column.date(),
    __metadata("design:type", DateTime)
], Cuti.prototype, "tanggalMulai", void 0);
__decorate([
    column.date(),
    __metadata("design:type", DateTime)
], Cuti.prototype, "tanggalSelesai", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Cuti.prototype, "lamaCuti", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Cuti.prototype, "alasan", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Cuti.prototype, "status", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Cuti.prototype, "approvedBy", void 0);
__decorate([
    column.date(),
    __metadata("design:type", Object)
], Cuti.prototype, "approval_date", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Cuti.prototype, "alasanDitolak", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], Cuti.prototype, "attachment", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Cuti.prototype, "pegawaiId", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Cuti.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Cuti.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Pegawai, {
        foreignKey: 'pegawaiId',
        localKey: 'id_pegawai',
    }),
    __metadata("design:type", Object)
], Cuti.prototype, "pegawai", void 0);
__decorate([
    belongsTo(() => CutiType, {
        foreignKey: 'cutiTypeId',
        localKey: 'id',
    }),
    __metadata("design:type", Object)
], Cuti.prototype, "cutiType", void 0);
//# sourceMappingURL=cuti.js.map