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
import { BaseModel, column, hasOne, belongsTo } from '@adonisjs/lucid/orm';
import Pegawai from '#models/pegawai';
import Divisi from '#models/divisi';
export default class Departemen extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", Number)
], Departemen.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Departemen.prototype, "nm_departemen", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], Departemen.prototype, "divisi_id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Departemen.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Departemen.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => Divisi, {
        foreignKey: 'divisi_id',
        localKey: 'id',
    }),
    __metadata("design:type", Object)
], Departemen.prototype, "divisi", void 0);
__decorate([
    hasOne(() => Pegawai),
    __metadata("design:type", Object)
], Departemen.prototype, "pegawai", void 0);
//# sourceMappingURL=departemen.js.map