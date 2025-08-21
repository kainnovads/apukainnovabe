import { BaseCommand } from '@adonisjs/core/ace';
import InvoiceReminderService from '#services/invoice_reminder_service';
export default class Scheduler extends BaseCommand {
    static commandName = 'scheduler:run';
    static description = 'Run scheduled tasks';
    static options = {};
    async run(mailer) {
        this.logger.info('⏰ Menjalankan scheduled tasks...');
        try {
            const reminderService = new InvoiceReminderService(mailer);
            await reminderService.sendReminders();
            await reminderService.sendOverdueReminders();
            this.logger.info('✅ Scheduled tasks berhasil dijalankan.');
        }
        catch (error) {
            this.logger.error('❌ Error menjalankan scheduler:', error.message);
        }
    }
}
//# sourceMappingURL=scheduler.js.map