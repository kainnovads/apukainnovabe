import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import SalesInvoice from '#models/sales_invoice'
import SalesInvoiceItem from '#models/sales_invoice_item'

export default class CheckSalesInvoiceItems extends BaseCommand {
  static commandName = 'check:sales-invoice-items'
  static description = 'Check sales invoice items data in database'

  static options: CommandOptions = {}

  async run() {
    this.logger.info('🔍 Checking Sales Invoice Items...')

    try {
      // Check total sales invoices
      const totalInvoices = await SalesInvoice.query().count('* as total')
      this.logger.info(`📊 Total Sales Invoices: ${totalInvoices[0].$extras.total}`)

      // Check total sales invoice items
      const totalItems = await SalesInvoiceItem.query().count('* as total')
      this.logger.info(`📦 Total Sales Invoice Items: ${totalItems[0].$extras.total}`)

      // Get latest sales invoice with items
      const latestInvoice = await SalesInvoice.query()
        .preload('salesInvoiceItems', (query) => {
          query.preload('product')
        })
        .orderBy('createdAt', 'desc')
        .first()

      if (latestInvoice) {
        this.logger.info(`📋 Latest Invoice: ${latestInvoice.noInvoice}`)
        this.logger.info(`📋 Invoice Items Count: ${latestInvoice.salesInvoiceItems.length}`)
        
        if (latestInvoice.salesInvoiceItems.length > 0) {
          this.logger.info('📦 Sample Items:')
          latestInvoice.salesInvoiceItems.forEach((item, index) => {
            this.logger.info(`   ${index + 1}. ${item.product?.name || 'No Product'} - Qty: ${item.quantity} - Price: ${item.price}`)
          })
        } else {
          this.logger.warning('⚠️  Latest invoice has no items!')
        }
      } else {
        this.logger.warning('⚠️  No sales invoices found!')
      }

      // Check if any sales orders have status partial but no invoices created
      const partialSalesOrders = await SalesInvoice.query()
        .preload('salesOrder', (query) => {
          query.preload('salesOrderItems')
        })
        .where('status', 'unpaid')
        .limit(5)

      this.logger.info(`🔄 Found ${partialSalesOrders.length} unpaid invoices`)

    } catch (error) {
      this.logger.error('❌ Error checking data:', error.message)
    }
  }
}