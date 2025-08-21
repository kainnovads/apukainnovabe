import { inject } from '@adonisjs/core'
import { Mailer } from '@adonisjs/mail'
import cron from 'node-cron'
import InvoiceReminderService from '#services/invoice_reminder_service'
import { DateTime } from 'luxon'

@inject()
export default class CronSchedulerService {
  private cronJobs: cron.ScheduledTask[] = []

  constructor(private mailer?: Mailer<any>) {}

  /**
   * Menjalankan invoice reminder menggunakan service yang sudah ada
   */
  private async runInvoiceReminderService() {
    try {
      console.log(` [${DateTime.now().toFormat('yyyy-MM-dd HH:mm:ss')}] Menjalankan invoice reminder service...`)

      if (!this.mailer) {
        console.warn('⚠️ Mailer tidak tersedia, skip invoice reminder')
        return { success: false, error: 'Mailer not available' }
      }

      const reminderService = new InvoiceReminderService(this.mailer)

      // Jalankan reminder untuk semua invoice unpaid/partial
      const reminderResult = await reminderService.sendReminders()
      console.log(`✅ Invoice reminder selesai: ${reminderResult.success} berhasil, ${reminderResult.error} gagal`)

      // Jalankan overdue reminder
      const overdueResult = await reminderService.sendOverdueReminders()
      console.log(`✅ Overdue reminder selesai: ${overdueResult.success} berhasil, ${overdueResult.error} gagal`)

      return {
        success: true,
        reminder: reminderResult,
        overdue: overdueResult,
        total: reminderResult.total + overdueResult.total
      }

    } catch (error) {
      console.error('❌ Error menjalankan invoice reminder service:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Memulai scheduler untuk invoice reminder (seminggu sekali - Senin jam 9 pagi)
   */
  startWeeklyInvoiceReminder() {
    console.log('📅 Memulai weekly invoice reminder scheduler (Setiap Senin jam 9:00)...')

    // Cron pattern: 0 9 * * 1 (Setiap Senin jam 9:00)
    const weeklyJob = cron.schedule('0 9 * * 1', async () => {
      console.log(' Menjalankan weekly invoice reminder...')
      await this.runInvoiceReminderService()
    }, {
      timezone: 'Asia/Jakarta'
    })

    this.cronJobs.push(weeklyJob)
    console.log('✅ Weekly invoice reminder scheduler berhasil dimulai')

    return weeklyJob
  }

  /**
   * Menghentikan semua scheduler
   */
  stopAllSchedulers() {
    console.log(' Menghentikan semua scheduler...')

    this.cronJobs.forEach((job, index) => {
      job.stop()
      console.log(`✅ Scheduler ${index + 1} dihentikan`)
    })

    this.cronJobs = []
    console.log('✅ Semua scheduler berhasil dihentikan')
  }

  /**
   * Mendapatkan status semua scheduler
   */
  getSchedulerStatus() {
    return {
      totalJobs: this.cronJobs.length,
      activeJobs: this.cronJobs.filter(job => job.getStatus() === 'scheduled').length,
      jobs: this.cronJobs.map((job, index) => ({
        id: index + 1,
        status: job.getStatus(),
        isRunning: job.getStatus() === 'scheduled'
      }))
    }
  }

  /**
   * Menjalankan scheduler sekali untuk testing
   */
  async runOnce() {
    console.log('🧪 Menjalankan scheduler sekali untuk testing...')
    return await this.runInvoiceReminderService()
  }
}
