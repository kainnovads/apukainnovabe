import { BaseCommand } from '@adonisjs/core/ace';
import CronSchedulerService from '#services/cron_scheduler_service';
export default class StartCronScheduler extends BaseCommand {
    static commandName = 'cron:start';
    static description = 'Start the cron scheduler for weekly invoice reminders';
    static options = {
        allowUnknownFlags: false,
    };
    async run() {
        this.logger.info('🚀 Memulai cron scheduler untuk weekly invoice reminder...');
        try {
            this.logger.info('📧 Mencoba mendapatkan Mailer instance...');
            let mailer;
            try {
                const { Mailer } = await import('@adonisjs/mail');
                mailer = new Mailer();
                this.logger.info('✅ Mailer instance berhasil dibuat');
                this.logger.info(`Mailer type: ${mailer.constructor.name}`);
            }
            catch (mailerError) {
                this.logger.error('❌ Mailer creation failed:', mailerError.message);
                this.logger.error('❌ Mailer error stack:', mailerError.stack);
                this.logger.error('❌ Mailer error type:', mailerError.constructor.name);
                throw mailerError;
            }
            this.logger.info('🔄 Membuat CronSchedulerService...');
            const schedulerService = new CronSchedulerService(mailer);
            this.logger.info('✅ CronSchedulerService berhasil dibuat');
            schedulerService.startWeeklyInvoiceReminder();
            this.logger.info('📅 Weekly scheduler berhasil dimulai (Setiap Senin jam 9:00)');
            const status = schedulerService.getSchedulerStatus();
            this.logger.info(`📊 Status scheduler: ${status.activeJobs}/${status.totalJobs} aktif`);
            this.logger.info('✅ Cron scheduler berhasil dimulai');
            this.logger.info('⏳ Scheduler sedang berjalan... (Ctrl+C untuk berhenti)');
            await new Promise(() => { });
        }
        catch (error) {
            this.logger.error('❌ Gagal memulai cron scheduler:', error.message);
            this.logger.error('❌ Stack trace:', error.stack);
            this.logger.error('❌ Error type:', error.constructor.name);
            this.logger.error('❌ Error details: ' + JSON.stringify(error, null, 2));
            this.exitCode = 1;
        }
    }
}
//# sourceMappingURL=start_cron_scheduler.js.map