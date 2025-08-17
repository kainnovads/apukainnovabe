import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { Mailer } from '@adonisjs/mail'
import InvoiceReminderService from '#services/invoice_reminder_service'

export default class Scheduler extends BaseCommand {
  static commandName = 'scheduler:run'
  static description = 'Run scheduled tasks'

  static options: CommandOptions = {}

  // Use dependency injection to get the Mailer instance.
  // This is the correct way to get services in modern AdonisJS commands.
  async run(mailer: Mailer<any>) {
    // The logger property is available on the command instance.
    this.logger.info('⏰ Menjalankan scheduled tasks...')

    try {
      // Run invoice reminders
      const reminderService = new InvoiceReminderService(mailer)
      await reminderService.sendReminders()
      await reminderService.sendOverdueReminders()
      this.logger.info('✅ Scheduled tasks berhasil dijalankan.')
    } catch (error) {
      // Log the error using the command's logger.
      this.logger.error('❌ Error menjalankan scheduler:', error.message)
    }
  }
}
