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
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm';
import JournalLine from '#models/journal_line';
import CashTransaction from '#models/cash_transaction';
export default class Account extends BaseModel {
    static table = 'accounts';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], Account.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], Account.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], Account.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Account.prototype, "description", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Account.prototype, "type", void 0);
__decorate([
    column(),
    __metadata("design:type", Boolean)
], Account.prototype, "isParent", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], Account.prototype, "parentId", void 0);
__decorate([
    belongsTo(() => Account),
    __metadata("design:type", Object)
], Account.prototype, "parent", void 0);
__decorate([
    hasMany(() => Account),
    __metadata("design:type", Object)
], Account.prototype, "children", void 0);
__decorate([
    hasMany(() => JournalLine),
    __metadata("design:type", Object)
], Account.prototype, "journalLines", void 0);
__decorate([
    hasMany(() => CashTransaction),
    __metadata("design:type", Object)
], Account.prototype, "cashTransactions", void 0);
//# sourceMappingURL=account.js.map