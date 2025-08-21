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
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import Account from '#models/account';
import Journal from '#models/journal';
export default class JournalLine extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], JournalLine.prototype, "id", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], JournalLine.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], JournalLine.prototype, "updatedAt", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], JournalLine.prototype, "journalId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], JournalLine.prototype, "accountId", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], JournalLine.prototype, "debit", void 0);
__decorate([
    column(),
    __metadata("design:type", Number)
], JournalLine.prototype, "credit", void 0);
__decorate([
    belongsTo(() => Journal),
    __metadata("design:type", Object)
], JournalLine.prototype, "journal", void 0);
__decorate([
    belongsTo(() => Account),
    __metadata("design:type", Object)
], JournalLine.prototype, "account", void 0);
//# sourceMappingURL=journal_line.js.map