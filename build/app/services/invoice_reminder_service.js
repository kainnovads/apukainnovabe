var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { inject } from '@adonisjs/core';
import { Mailer } from '@adonisjs/mail';
import SalesInvoice from '#models/sales_invoice';
import Perusahaan from '#models/perusahaan';
import InvoiceReminder from '#mails/invoice_reminder';
import { DateTime } from 'luxon';
let InvoiceReminderService = class InvoiceReminderService {
    mailer;
    constructor(mailer) {
        this.mailer = mailer;
    }
    async sendReminders() {
        try {
            const pendingInvoices = await SalesInvoice.query()
                .whereIn('status', ['unpaid', 'partial'])
                .preload('customer')
                .preload('salesOrder', (query) => {
                query.preload('perusahaan');
            });
            let successCount = 0;
            let errorCount = 0;
            for (const invoice of pendingInvoices) {
                try {
                    if (!invoice.email) {
                        console.warn(`⚠️ Customer ${invoice.customer?.name} tidak memiliki email untuk invoice ${invoice.noInvoice}`);
                        continue;
                    }
                    const perusahaan = invoice.salesOrder?.perusahaan || await Perusahaan.first();
                    await this.mailer.send(new InvoiceReminder(invoice, invoice.customer, perusahaan));
                    console.info(`✅ Email reminder terkirim untuk invoice ${invoice.noInvoice} ke ${invoice.email}`);
                    successCount++;
                }
                catch (error) {
                    console.error(`❌ Gagal mengirim email untuk invoice ${invoice.noInvoice}:`, error.message);
                    errorCount++;
                }
            }
            return {
                success: successCount,
                error: errorCount,
                total: pendingInvoices.length
            };
        }
        catch (error) {
            console.error('❌ Error dalam service invoice reminder:', error);
            throw error;
        }
    }
    async sendOverdueReminders() {
        try {
            const today = DateTime.now().toJSDate();
            const overdueInvoices = await SalesInvoice.query()
                .whereIn('status', ['unpaid', 'partial'])
                .where('dueDate', '<', today)
                .preload('customer')
                .preload('salesOrder', (query) => {
                query.preload('perusahaan');
            });
            let successCount = 0;
            let errorCount = 0;
            for (const invoice of overdueInvoices) {
                try {
                    if (!invoice.email) {
                        continue;
                    }
                    const perusahaan = invoice.salesOrder?.perusahaan || await Perusahaan.first();
                    const reminder = new InvoiceReminder(invoice, invoice.customer, perusahaan);
                    reminder.subject = '⚠️ URGENT: Tagihan Invoice Telah Melewati Jatuh Tempo';
                    await this.mailer.send(reminder);
                    console.info(`✅ Email overdue reminder terkirim untuk invoice ${invoice.noInvoice}`);
                    successCount++;
                }
                catch (error) {
                    console.error(`❌ Gagal mengirim overdue email untuk invoice ${invoice.noInvoice}:`, error.message);
                    errorCount++;
                }
            }
            return {
                success: successCount,
                error: errorCount,
                total: overdueInvoices.length
            };
        }
        catch (error) {
            console.error('❌ Error dalam service overdue reminder:', error);
            throw error;
        }
    }
};
InvoiceReminderService = __decorate([
    inject(),
    __metadata("design:paramtypes", [Mailer])
], InvoiceReminderService);
export default InvoiceReminderService;
//# sourceMappingURL=invoice_reminder_service.js.map