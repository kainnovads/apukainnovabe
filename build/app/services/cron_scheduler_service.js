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
import cron from 'node-cron';
import InvoiceReminderService from '#services/invoice_reminder_service';
import { DateTime } from 'luxon';
let CronSchedulerService = class CronSchedulerService {
    mailer;
    cronJobs = [];
    constructor(mailer) {
        this.mailer = mailer;
    }
    async runInvoiceReminderService() {
        try {
            console.log(` [${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}] Menjalankan invoice reminder service...`);
            if (!this.mailer) {
                console.warn('⚠️ Mailer tidak tersedia, skip invoice reminder');
                return { success: false, error: 'Mailer not available' };
            }
            const reminderService = new InvoiceReminderService(this.mailer);
            const reminderResult = await reminderService.sendReminders();
            console.log(`✅ Invoice reminder selesai: ${reminderResult.success} berhasil, ${reminderResult.error} gagal`);
            const overdueResult = await reminderService.sendOverdueReminders();
            console.log(`✅ Overdue reminder selesai: ${overdueResult.success} berhasil, ${overdueResult.error} gagal`);
            return {
                success: true,
                reminder: reminderResult,
                overdue: overdueResult,
                total: reminderResult.total + overdueResult.total
            };
        }
        catch (error) {
            console.error('❌ Error menjalankan invoice reminder service:', error.message);
            return { success: false, error: error.message };
        }
    }
    startWeeklyInvoiceReminder() {
        console.log('📅 Memulai weekly invoice reminder scheduler (Setiap Senin jam 9:00)...');
        const weeklyJob = cron.schedule('0 9 * * 1', async () => {
            console.log(' Menjalankan weekly invoice reminder...');
            await this.runInvoiceReminderService();
        }, {
            timezone: 'Asia/Jakarta'
        });
        this.cronJobs.push(weeklyJob);
        console.log('✅ Weekly invoice reminder scheduler berhasil dimulai');
        return weeklyJob;
    }
    stopAllSchedulers() {
        console.log(' Menghentikan semua scheduler...');
        this.cronJobs.forEach((job, index) => {
            job.stop();
            console.log(`✅ Scheduler ${index + 1} dihentikan`);
        });
        this.cronJobs = [];
        console.log('✅ Semua scheduler berhasil dihentikan');
    }
    getSchedulerStatus() {
        return {
            totalJobs: this.cronJobs.length,
            activeJobs: this.cronJobs.filter(job => job.getStatus() === 'scheduled').length,
            jobs: this.cronJobs.map((job, index) => ({
                id: index + 1,
                status: job.getStatus(),
                isRunning: job.getStatus() === 'scheduled'
            }))
        };
    }
    async runOnce() {
        console.log('🧪 Menjalankan scheduler sekali untuk testing...');
        return await this.runInvoiceReminderService();
    }
};
CronSchedulerService = __decorate([
    inject(),
    __metadata("design:paramtypes", [Mailer])
], CronSchedulerService);
export default CronSchedulerService;
//# sourceMappingURL=cron_scheduler_service.js.map