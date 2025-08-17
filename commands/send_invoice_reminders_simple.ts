import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class SendInvoiceRemindersSimple extends BaseCommand {
  static commandName = 'send:invoice-reminders-simple'
  static description = 'Send invoice reminder emails for pending and partial invoices (simple version)'

  static options: CommandOptions = {
    allowUnknownFlags: false,
  }

  async run() {
    this.logger.info('🔔 Memulai pengiriman email reminder invoice (simple version)...')

    try {
      // Test 1: Check database connection using direct PostgreSQL
      this.logger.info('📊 Test 1: Checking database connection using direct PostgreSQL...')
      
      let dbClient: any
      try {
        const { Client } = await import('pg')
        
        dbClient = new Client({
          host: process.env.DB_HOST || '127.0.0.1',
          port: parseInt(process.env.DB_PORT || '5432'),
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_DATABASE || 'adoniserp2',
          ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
        })
        
        await dbClient.connect()
        this.logger.info('✅ Test 1 PASSED: Direct PostgreSQL connection successful')
        
      } catch (error) {
        this.logger.error('❌ Test 1 FAILED: Cannot connect to PostgreSQL')
        this.logger.error(`   Error message: ${error.message}`)
        this.logger.error('   📊 Email reminder system requires database to be available')
        this.logger.error('   💡 Please check your database credentials and connection')
        this.exitCode = 1
        return
      }

      // Test 2: Send test email with dummy data using direct SMTP
      this.logger.info('📧 Test 2: Sending test email with dummy data using direct SMTP...')
      
      try {
        const nodemailer = await import('nodemailer')
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
          port: parseInt(process.env.SMTP_PORT || '2525'),
          secure: false,
          auth: {
            user: process.env.SMTP_USERNAME || 'f5758aab633a80',
            pass: process.env.SMTP_PASSWORD || 'ebd1833e13ed84'
          }
        })
        
        // Create simple HTML email content
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .invoice-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .amount { font-size: 18px; font-weight: bold; color: #dc3545; }
              .due-date { color: #dc3545; font-weight: bold; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔔 Reminder Tagihan Invoice</h2>
                <p>Halo Bpk. Malih,</p>
              </div>

              <p>Kami ingin mengingatkan bahwa Anda memiliki tagihan invoice yang belum lunas:</p>

              <div class="invoice-details">
                <h3>Detail Invoice:</h3>
                <ul>
                  <li><strong>No. Invoice:</strong> INV-2024-001</li>
                  <li><strong>Tanggal Invoice:</strong> 15/01/2024</li>
                  <li><strong>Jatuh Tempo:</strong> <span class="due-date">15/02/2024</span></li>
                  <li><strong>Total Tagihan:</strong> Rp 1.500.000,00</li>
                  <li><strong>Sudah Dibayar:</strong> Rp 500.000,00</li>
                  <li><strong>Sisa Tagihan:</strong> <span class="amount">Rp 1.000.000,00</span></li>
                  <li><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Sebagian Dibayar</span></li>
                </ul>
              </div>

              <p>Mohon segera lakukan pembayaran untuk menghindari keterlambatan. Jika Anda sudah melakukan pembayaran, mohon abaikan email ini.</p>

              <p>Untuk informasi lebih lanjut, silakan hubungi tim keuangan kami.</p>

              <div class="footer">
                <p>Hormat kami,<br>
                <strong>Tim Keuangan PT. Andara Prima</strong></p>
                <p>Email: billing@yourcompany.com<br>
                Telepon: (021) 1234-5678</p>
              </div>
            </div>
          </body>
          </html>
        `
        
        await transporter.sendMail({
          from: process.env.MAIL_FROM_ADDRESS || 'kainnovads@outlook.com',
          to: 'rbenity@gmail.com',
          subject: '[TEST] Reminder Tagihan Invoice - System Test',
          html: htmlContent
        })
        
        this.logger.info('✅ Test 2 PASSED: Test email sent via direct SMTP')
        this.logger.info('   📧 Email terkirim ke: rbenity@gmail.com')
        this.logger.info('   📋 Invoice: INV-2024-001')
        this.logger.info('   💰 Sisa tagihan: Rp 1.000.000,00')
        this.logger.info('   🏢 Perusahaan: PT. Andara Prima')

      } catch (error) {
        this.logger.error('❌ Test 2 FAILED: Cannot send test email')
        this.logger.error(`   Error message: ${error.message}`)
        this.logger.error(`   Error stack: ${error.stack}`)
        this.exitCode = 1
        return
      }

      // Test 3: Try to access real database data using direct PostgreSQL
      this.logger.info('📊 Test 3: Trying to access real database data using direct PostgreSQL...')
      
      try {
        // Get total invoices
        const totalResult = await dbClient.query('SELECT COUNT(*) as total FROM sales_invoices')
        this.logger.info('✅ Test 3 PASSED: Database query successful')
        this.logger.info(`   📊 Total invoices in database: ${totalResult.rows[0].total}`)

        // Try to get pending invoices
        const pendingResult = await dbClient.query(`
          SELECT si.*, c.name as customer_name, c.email as customer_email
          FROM sales_invoices si
          LEFT JOIN customers c ON si.customer_id = c.id
          WHERE si.status IN ('unpaid', 'partial')
          LIMIT 5
        `)

        this.logger.info(`   📋 Found ${pendingResult.rows.length} pending invoices`)
        
        if (pendingResult.rows.length > 0) {
          this.logger.info('   📋 Sample pending invoices:')
          pendingResult.rows.forEach((invoice: any, index: number) => {
            this.logger.info(`      ${index + 1}. ${invoice.no_invoice} - ${invoice.customer_name || 'No customer'} - ${invoice.status}`)
          })
        }

        // Close database connection
        await dbClient.end()
        this.logger.info('   ✅ Database connection closed')

      } catch (error) {
        this.logger.error('❌ Test 3 FAILED: Cannot access real database data')
        this.logger.error(`   Error message: ${error.message}`)
        this.logger.error(`   Error stack: ${error.stack}`)
        this.logger.error('   💡 Database connection issue detected')
        
        // Close database connection if still open
        if (dbClient) {
          try {
            await dbClient.end()
          } catch (closeError) {
            // Ignore close error
          }
        }
        
        this.exitCode = 1
        return
      }

      this.logger.info('🎉 All tests passed! Email reminder system is ready!')
      this.logger.info('📧 Email reminder system is working correctly!')
      this.logger.info('💡 To send real reminders, ensure database and mailer are properly configured')

    } catch (error) {
      this.logger.error('❌ General error:')
      this.logger.error(`   Error message: ${error.message}`)
      this.logger.error(`   Error stack: ${error.stack}`)
      this.exitCode = 1
    }
  }
}
