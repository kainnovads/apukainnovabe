import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'

export default class CheckDatabaseStructure extends BaseCommand {
  static commandName = 'check:database-structure'
  static description = 'Check database structure to understand table names and relationships'

  static options: CommandOptions = {
    allowUnknownFlags: false,
  }

  async run() {
    this.logger.info('🔍 Checking database structure...')

    try {
      // Connect to database
      const { Client } = await import('pg')
      
      const dbClient = new Client({
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'adoniserp2',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
      })
      
      await dbClient.connect()
      this.logger.info('✅ Database connection successful')

      // Check all tables
      this.logger.info('📊 Step 1: Checking all tables...')
      
      const tablesResult = await dbClient.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `)
      
      this.logger.info(`   📋 Found ${tablesResult.rows.length} tables:`)
      tablesResult.rows.forEach((row: any) => {
        this.logger.info(`      - ${row.table_name}`)
      })

      // Check sales_invoices table structure
      this.logger.info('📊 Step 2: Checking sales_invoices table structure...')
      
      const salesInvoicesColumns = await dbClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'sales_invoices'
        ORDER BY ordinal_position
      `)
      
      this.logger.info('   📋 sales_invoices columns:')
      salesInvoicesColumns.rows.forEach((row: any) => {
        this.logger.info(`      - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
      })

      // Check customers table structure
      this.logger.info('📊 Step 3: Checking customers table structure...')
      
      const customersColumns = await dbClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'customers'
        ORDER BY ordinal_position
      `)
      
      this.logger.info('   📋 customers columns:')
      customersColumns.rows.forEach((row: any) => {
        this.logger.info(`      - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
      })

      // Check if perusahaans table exists
      this.logger.info('📊 Step 4: Checking if perusahaans table exists...')
      
      const perusahaansExists = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'perusahaans'
        )
      `)
      
      if (perusahaansExists.rows[0].exists) {
        this.logger.info('   ✅ perusahaans table exists')
        
        const perusahaansColumns = await dbClient.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'perusahaans'
          ORDER BY ordinal_position
        `)
        
        this.logger.info('   📋 perusahaans columns:')
        perusahaansColumns.rows.forEach((row: any) => {
          this.logger.info(`      - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
        })
      } else {
        this.logger.info('   ❌ perusahaans table does not exist')
        
        // Check for similar table names
        const similarTables = await dbClient.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name LIKE '%perusahaan%'
          ORDER BY table_name
        `)
        
        if (similarTables.rows.length > 0) {
          this.logger.info('   📋 Similar table names found:')
          similarTables.rows.forEach((row: any) => {
            this.logger.info(`      - ${row.table_name}`)
          })
        } else {
          this.logger.info('   📋 No similar table names found')
        }
      }

      // Check sales_orders table structure
      this.logger.info('📊 Step 5: Checking sales_orders table structure...')
      
      const salesOrdersExists = await dbClient.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'sales_orders'
        )
      `)
      
      if (salesOrdersExists.rows[0].exists) {
        this.logger.info('   ✅ sales_orders table exists')
        
        const salesOrdersColumns = await dbClient.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'sales_orders'
          ORDER BY ordinal_position
        `)
        
        this.logger.info('   📋 sales_orders columns:')
        salesOrdersColumns.rows.forEach((row: any) => {
          this.logger.info(`      - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
        })
      } else {
        this.logger.info('   ❌ sales_orders table does not exist')
      }

      // Check sample data from sales_invoices
      this.logger.info('📊 Step 6: Checking sample data from sales_invoices...')
      
      const sampleInvoices = await dbClient.query(`
        SELECT * FROM sales_invoices LIMIT 3
      `)
      
      this.logger.info(`   📋 Sample invoices (${sampleInvoices.rows.length} rows):`)
      sampleInvoices.rows.forEach((row: any, index: number) => {
        this.logger.info(`      ${index + 1}. ID: ${row.id}, No: ${row.no_invoice}, Status: ${row.status}, Customer ID: ${row.customer_id}`)
      })

      await dbClient.end()
      this.logger.info('✅ Database connection closed')

    } catch (error) {
      this.logger.error('❌ Error:')
      this.logger.error(`   Error message: ${error.message}`)
      this.logger.error(`   Error stack: ${error.stack}`)
      this.exitCode = 1
    }
  }
}
