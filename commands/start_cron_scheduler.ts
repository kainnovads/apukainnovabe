import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

import CronSchedulerService from '#services/cron_scheduler_service'

export default class StartCronScheduler extends BaseCommand {
  static commandName = 'cron:start'
  static description = 'Start the cron scheduler for invoice reminders'

  static options: CommandOptions = {
    allowUnknownFlags: false,
  }

  async run() {
    this.logger.info('🚀 Memulai cron scheduler untuk invoice reminder...')

    try {
      this.logger.info('📧 Mencoba mendapatkan Mailer instance...')
      let mailer
      try {
        // Gunakan metode yang working - import dan instantiate langsung
        const { Mailer } = await import('@adonisjs/mail')
        // @ts-ignore - Ignore TypeScript error untuk constructor parameter
        mailer = new Mailer()
        this.logger.info('✅ Mailer instance berhasil dibuat')
        this.logger.info(`Mailer type: ${mailer.constructor.name}`)
      } catch (mailerError) {
        this.logger.error('❌ Mailer creation failed:', mailerError.message)
        this.logger.error('❌ Mailer error stack:', mailerError.stack)
        this.logger.error('❌ Mailer error type:', mailerError.constructor.name)
        throw mailerError
      }

      this.logger.info('🔄 Membuat CronSchedulerService...')
      const schedulerService = new CronSchedulerService(mailer)
      this.logger.info('✅ CronSchedulerService berhasil dibuat')

      // Ambil parameter dari command line
      const scheduleType = this.parsed.flags.type || 'all'
      const cronPattern = this.parsed.flags.pattern
      const description = this.parsed.flags.description || 'Custom scheduler'

      this.logger.info(`📅 Tipe scheduler: ${scheduleType}`)

      switch (scheduleType) {
        case 'weekly':
          schedulerService.startWeeklyInvoiceReminder()
          this.logger.info('📅 Scheduler akan berjalan setiap Senin jam 9:00')
          break

        case 'daily':
          schedulerService.startDailyOverdueReminder()
          this.logger.info('📅 Scheduler akan berjalan setiap hari jam 9:00')
          break

        case 'custom':
          if (!cronPattern) {
            this.logger.error('❌ Pattern cron harus diisi untuk custom scheduler')
            this.exitCode = 1
            return
          }
          schedulerService.startCustomScheduler(cronPattern, description)
          this.logger.info(`📅 Scheduler custom berjalan dengan pattern: ${cronPattern}`)
          break

        case 'all':
        default:
          schedulerService.startAllSchedulers()
          this.logger.info('📅 Semua scheduler berhasil dimulai')
          break
      }

      // Tampilkan status scheduler
      const status = schedulerService.getSchedulerStatus()
      this.logger.info(`📊 Status scheduler: ${status.activeJobs}/${status.totalJobs} aktif`)

      this.logger.info('✅ Cron scheduler berhasil dimulai')
      this.logger.info('⏳ Scheduler sedang berjalan... (Ctrl+C untuk berhenti)')

      // Keep the process alive
      await new Promise(() => {})

    } catch (error) {
      this.logger.error('❌ Gagal memulai cron scheduler:', error.message)
      this.logger.error('❌ Stack trace:', error.stack)
      this.logger.error('❌ Error type:', error.constructor.name)
      this.logger.error('❌ Error details: ' + JSON.stringify(error, null, 2))
      this.exitCode = 1
    }
  }
}
