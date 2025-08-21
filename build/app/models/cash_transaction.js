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
import Account from '#models/account';
export default class CashTransaction extends BaseModel {
    static table = 'cash_transactions';
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], CashTransaction.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], CashTransaction.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], CashTransaction.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], CashTransaction.prototype, "type", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CashTransaction.prototype, "accountId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CashTransaction.prototype, "amount", void 0);
__decorate([
    column(),
    __metadata("design:type", Date)
], CashTransaction.prototype, "date", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], CashTransaction.prototype, "sourceType", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], CashTransaction.prototype, "sourceId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], CashTransaction.prototype, "description", void 0);
__decorate([
    belongsTo(() => Account, { foreignKey: 'accountId', localKey: 'id' }),
    __metadata("design:type", Object)
], CashTransaction.prototype, "account", void 0);
//# sourceMappingURL=cash_transaction.js.map