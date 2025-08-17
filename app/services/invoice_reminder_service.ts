import { inject } from '@adonisjs/core'
import { Mailer } from '@adonisjs/mail'
import SalesInvoice from '#models/sales_invoice'
import Perusahaan from '#models/perusahaan'
import InvoiceReminder from '#mails/invoice_reminder'
import { DateTime } from 'luxon'

@inject()
export default class InvoiceReminderService {
  constructor(private mailer: Mailer<any>) {}

  /**
   * Mengirim email reminder untuk invoice yang pending dan partial
   */
  async sendReminders() {
    try {
      // Ambil invoice dengan status unpaid dan partial
      const pendingInvoices = await SalesInvoice.query()
        .whereIn('status', ['unpaid', 'partial'])
        .preload('customer')
        .preload('salesOrder', (query) => {
          query.preload('perusahaan')
        })

      let successCount = 0
      let errorCount = 0

      for (const invoice of pendingInvoices) {
        try {
          // Pastikan customer memiliki email
          if (!invoice.email) {
            console.warn(`⚠️ Customer ${invoice.customer?.name} tidak memiliki email untuk invoice ${invoice.noInvoice}`)
            continue
          }

          // Ambil data perusahaan
          const perusahaan = invoice.salesOrder?.perusahaan || await Perusahaan.first()

          // Kirim email reminder
          await this.mailer.send(new InvoiceReminder(invoice, invoice.customer, perusahaan))
          
          console.info(`✅ Email reminder terkirim untuk invoice ${invoice.noInvoice} ke ${invoice.email}`)
          successCount++

        } catch (error) {
          console.error(`❌ Gagal mengirim email untuk invoice ${invoice.noInvoice}:`, error.message)
          errorCount++
        }
      }

      return {
        success: successCount,
        error: errorCount,
        total: pendingInvoices.length
      }

    } catch (error) {
      console.error('❌ Error dalam service invoice reminder:', error)
      throw error
    }
  }

  /**
   * Mengirim reminder khusus untuk invoice yang sudah lewat jatuh tempo
   */
  async sendOverdueReminders() {
    try {
      const today = DateTime.now().toJSDate()
      
      const overdueInvoices = await SalesInvoice.query()
        .whereIn('status', ['unpaid', 'partial'])
        .where('dueDate', '<', today)
        .preload('customer')
        .preload('salesOrder', (query) => {
          query.preload('perusahaan')
        })

      let successCount = 0
      let errorCount = 0

      for (const invoice of overdueInvoices) {
        try {
          if (!invoice.email) {
            continue
          }

          const perusahaan = invoice.salesOrder?.perusahaan || await Perusahaan.first()
          
          // Kirim email dengan subject yang berbeda untuk overdue
          const reminder = new InvoiceReminder(invoice, invoice.customer, perusahaan)
          reminder.subject = '⚠️ URGENT: Tagihan Invoice Telah Melewati Jatuh Tempo'
          
          await this.mailer.send(reminder)
          
          console.info(`✅ Email overdue reminder terkirim untuk invoice ${invoice.noInvoice}`)
          successCount++

        } catch (error) {
          console.error(`❌ Gagal mengirim overdue email untuk invoice ${invoice.noInvoice}:`, error.message)
          errorCount++
        }
      }

      return {
        success: successCount,
        error: errorCount,
        total: overdueInvoices.length
      }

    } catch (error) {
      console.error('❌ Error dalam service overdue reminder:', error)
      throw error
    }
  }
}
