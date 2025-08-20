import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class SendRealInvoiceReminders extends BaseCommand {
  static commandName = 'send:real-invoice-reminders'
  static description = 'Send real invoice reminder emails for pending and partial invoices'

  static options: CommandOptions = {
    allowUnknownFlags: false,
  }

  async run() {
    this.logger.info('🔔 Memulai pengiriman email reminder invoice dengan data real...')

    try {
      // Step 1: Connect to database
      this.logger.info('📊 Step 1: Connecting to database...')

      let dbClient: any
      try {
        const { Client } = await import('pg')

        dbClient = new Client({
          host: process.env.DB_HOST || '127.0.0.1',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_DATABASE || 'adoniserp',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        })

        await dbClient.connect()
        this.logger.info('✅ Database connection successful')

      } catch (error) {
        this.logger.error('❌ Cannot connect to database')
        this.logger.error(`   Error message: ${error.message}`)
        this.exitCode = 1
        return
      }

      // Step 2: Get pending invoices with customer and company data
      this.logger.info('📊 Step 2: Fetching pending invoices...')

      let pendingInvoices: any[] = []
      try {
        const result = await dbClient.query(`
          SELECT
            si.id,
            si.no_invoice,
            si.date,
            si.due_date,
            si.total,
            si.paid_amount,
            si.remaining_amount,
            si.status,
            si.description,
            si.email as invoice_email,
            p.sku,
            p.name as product_name,
            sii.description as item_description,
            sii.quantity,
            sii.price,
            sii.subtotal,
            c.id as customer_id,
            c.name as customer_name,
            c.phone as customer_phone,
            c.address as customer_address,
            comp.id as perusahaan_id,
            comp.nm_perusahaan,
            comp.alamat_perusahaan as perusahaan_alamat,
            comp.tlp_perusahaan as perusahaan_phone,
            comp.email_perusahaan as perusahaan_email
          FROM sales_invoices si
          LEFT JOIN customers c ON si.customer_id = c.id
          LEFT JOIN sales_invoice_items sii ON si.id = sii.sales_invoice_id
          LEFT JOIN products p ON sii.product_id = p.id
          LEFT JOIN sales_orders so ON si.sales_order_id = so.id
          LEFT JOIN perusahaan comp ON so.perusahaan_id = comp.id
          WHERE si.status IN ('unpaid', 'partial')
          AND si.email IS NOT NULL
          AND si.email != ''
          ORDER BY si.due_date ASC
        `)

        pendingInvoices = result.rows
        this.logger.info(`✅ Found ${pendingInvoices.length} pending invoices with valid email addresses`)

        if (pendingInvoices.length === 0) {
          this.logger.info('💡 No pending invoices found with valid email addresses')
          await dbClient.end()
          return
        }

      } catch (error) {
        this.logger.error('❌ Cannot fetch pending invoices')
        this.logger.error(`   Error message: ${error.message}`)
        await dbClient.end()
        this.exitCode = 1
        return
      }

      // Step 3: Setup email transporter
      this.logger.info('📧 Step 3: Setting up email transporter...')

      let transporter: any
      try {
        const nodemailer = await import('nodemailer')

        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USERNAME || 'financeandara@gmail.com',
            pass: process.env.SMTP_PASSWORD || 'dcdntkmvstdulhjp'
          }
        })

        this.logger.info('✅ Email transporter setup successful')

      } catch (error) {
        this.logger.error('❌ Cannot setup email transporter')
        this.logger.error(`   Error message: ${error.message}`)
        await dbClient.end()
        this.exitCode = 1
        return
      }

      // Step 4: Load HTML template
      this.logger.info('📄 Step 4: Loading HTML template...')
      let templateHtml = ''
      try {
        const fs = await import('node:fs/promises')
        const path = await import('node:path')
        const templatePath = path.join(process.cwd(), 'resources', 'emails', 'invoice_reminder.html')
        templateHtml = await fs.readFile(templatePath, 'utf8')
        this.logger.info('✅ Template loaded')
      } catch (error) {
        this.logger.error('❌ Cannot load HTML template')
        this.logger.error(`   Error: ${error.message}`)
        await dbClient.end()
        this.exitCode = 1
        return
      }

      // Step 5: Send reminder emails
      this.logger.info('📧 Step 5: Sending reminder emails...')

      let successCount = 0
      let errorCount = 0

      for (const invoice of pendingInvoices) {
        try {
          // Format dates
          const invoiceDate = invoice.date ? new Date(invoice.date).toLocaleDateString('id-ID') : 'N/A'
          const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('id-ID') : 'N/A'

          // Format amounts
          const totalAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(invoice.total || 0)

          const paidAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(invoice.paid_amount || 0)

          const remainingAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(invoice.remaining_amount || 0)

          // Format item amounts
          const priceAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(invoice.price || 0)

          const subtotalAmount = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(invoice.subtotal || 0)

          // Render template with data
          const htmlContent = templateHtml
            .replaceAll('{{customer_name}}', invoice.customer_name || 'Customer')
            .replaceAll('{{customer_address}}', invoice.customer_address || 'N/A')
            .replaceAll('{{customer_phone}}', invoice.customer_phone || 'N/A')
            .replaceAll('{{no_invoice}}', invoice.no_invoice || 'N/A')
            .replaceAll('{{invoice_date}}', invoiceDate)
            .replaceAll('{{due_date}}', dueDate)
            .replaceAll('{{sku}}', invoice.sku || 'N/A')
            .replaceAll('{{product_name}}', invoice.product_name || 'N/A')
            .replaceAll('{{item_description}}', invoice.item_description || 'N/A')
            .replaceAll('{{quantity}}', invoice.quantity || 'N/A')
            .replaceAll('{{price}}', priceAmount)
            .replaceAll('{{subtotal}}', subtotalAmount)
            .replaceAll('{{total_amount}}', totalAmount)
            .replaceAll('{{paid_amount}}', paidAmount)
            .replaceAll('{{remaining_amount}}', remainingAmount)
            .replaceAll('{{status_label}}', invoice.status === 'partial' ? 'Sebagian Dibayar' : 'Belum Dibayar')
            .replaceAll('{{status_class}}', `status-${invoice.status}`)
            .replaceAll('{{description}}', invoice.description ? `<li><strong>Keterangan:</strong> ${invoice.description}</li>` : '')
            .replaceAll('{{nm_perusahaan}}', invoice.nm_perusahaan || 'Perusahaan')
            .replaceAll('{{perusahaan_phone}}', invoice.perusahaan_phone ? `<p>Telepon: ${invoice.perusahaan_phone}</p>` : '')
            .replaceAll('{{perusahaan_email}}', invoice.perusahaan_email ? `<p>Email: ${invoice.perusahaan_email}</p>` : '')

          // Send email
          await transporter.sendMail({
            from: process.env.MAIL_FROM_ADDRESS || 'kainnovads@outlook.com',
            to: invoice.invoice_email,
            subject: `Reminder Tagihan Invoice - ${invoice.no_invoice}`,
            html: htmlContent
          })

          successCount++
          this.logger.info(`   ✅ Email sent to ${invoice.invoice_email} for invoice ${invoice.no_invoice}`)

        } catch (error) {
          errorCount++
          this.logger.error(`   ❌ Failed to send email to ${invoice.invoice_email} for invoice ${invoice.no_invoice}`)
          this.logger.error(`      Error: ${error.message}`)
        }
      }

      // Step 5: Summary
      this.logger.info('📊 Step 5: Summary...')
      this.logger.info(`   📧 Total invoices processed: ${pendingInvoices.length}`)
      this.logger.info(`   ✅ Successful emails sent: ${successCount}`)
      this.logger.info(`   ❌ Failed emails: ${errorCount}`)

      if (successCount > 0) {
        this.logger.info('🎉 Email reminder system completed successfully!')
      } else {
        this.logger.warning('⚠️ No emails were sent successfully')
      }

      // Close database connection
      await dbClient.end()
      this.logger.info('✅ Database connection closed')

    } catch (error) {
      this.logger.error('❌ General error:')
      this.logger.error(`   Error message: ${error.message}`)
      this.logger.error(`   Error stack: ${error.stack}`)
      this.exitCode = 1
    }
  }
}
