import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import BankAccount from '#models/bank_account'
import Expense from '#models/expense'
import ApPayment from '#models/ap_payment'
import ArReceipt from '#models/ar_receipt'
import Asset from '#models/asset'
import Tax from '#models/tax'

@inject()
export default class FinanceDashboardController {
  async index({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      // Data Bank Accounts
      const bankAccounts = await BankAccount.query()
        .select('bankName', 'accountNumber', 'openingBalance')
        .orderBy('bankName', 'asc')

      const totalBankBalance = bankAccounts.reduce((sum, account) => sum + account.openingBalance, 0)

      // Data Expenses
      const expenseQuery = Expense.query()
      if (startDate && endDate) {
        expenseQuery.whereBetween('date', [startDate, endDate])
      }
      const totalExpenses = await expenseQuery.sum('amount as total')
      const expenseCount = await expenseQuery.count('* as total')

      // Data AP Payments (Pembayaran Hutang)
      const apPaymentQuery = ApPayment.query()
      if (startDate && endDate) {
        apPaymentQuery.whereBetween('date', [startDate, endDate])
      }
      const totalApPayments = await apPaymentQuery.sum('amount as total')
      const apPaymentCount = await apPaymentQuery.count('* as total')

      // Data AR Receipts (Penerimaan Piutang)
      const arReceiptQuery = ArReceipt.query()
      if (startDate && endDate) {
        arReceiptQuery.whereBetween('date', [startDate, endDate])
      }
      const totalArReceipts = await arReceiptQuery.sum('amount as total')
      const arReceiptCount = await arReceiptQuery.count('* as total')

      // Data Assets
      const totalAssets = await Asset.query().count('* as total')
      const activeAssets = await Asset.query().where('isActive', true).count('* as total')
      const totalAssetValue = await Asset.query().sum('acquisitionCost as total')

      // Data Taxes
      const activeTaxes = await Tax.query().where('isActive', true).count('* as total')

      // Recent Transactions
      const recentExpenses = await Expense.query()
        .preload('departemen')
        .preload('bankAccount')
        .orderBy('date', 'desc')
        .limit(5)

      const recentApPayments = await ApPayment.query()
        .preload('vendor')
        .preload('bankAccount')
        .orderBy('date', 'desc')
        .limit(5)

      const recentArReceipts = await ArReceipt.query()
        .preload('customer')
        .preload('bankAccount')
        .orderBy('date', 'desc')
        .limit(5)

      return response.ok({
        status: 'success',
        data: {
          summary: {
            totalBankBalance: totalBankBalance || 0,
            totalExpenses: totalExpenses[0].$extras.total || 0,
            totalApPayments: totalApPayments[0].$extras.total || 0,
            totalArReceipts: totalArReceipts[0].$extras.total || 0,
            totalAssets: totalAssets[0].$extras.total || 0,
            activeAssets: activeAssets[0].$extras.total || 0,
            totalAssetValue: totalAssetValue[0].$extras.total || 0,
            activeTaxes: activeTaxes[0].$extras.total || 0
          },
          counts: {
            expenseCount: expenseCount[0].$extras.total || 0,
            apPaymentCount: apPaymentCount[0].$extras.total || 0,
            arReceiptCount: arReceiptCount[0].$extras.total || 0
          },
          bankAccounts,
          recentTransactions: {
            expenses: recentExpenses,
            apPayments: recentApPayments,
            arReceipts: recentArReceipts
          }
        },
        message: 'Dashboard keuangan berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil dashboard keuangan'
      })
    }
  }

  async getCashFlow({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      if (!startDate || !endDate) {
        return response.badRequest({
          status: 'error',
          message: 'Tanggal awal dan akhir diperlukan'
        })
      }

      // Cash Inflows (Penerimaan)
      const arReceipts = await ArReceipt.query()
        .whereBetween('date', [startDate, endDate])
        .sum('amount as total')

      // Cash Outflows (Pengeluaran)
      const expenses = await Expense.query()
        .whereBetween('date', [startDate, endDate])
        .sum('amount as total')

      const apPayments = await ApPayment.query()
        .whereBetween('date', [startDate, endDate])
        .sum('amount as total')

      const totalInflow = arReceipts[0].$extras.total || 0
      const totalOutflow = (expenses[0].$extras.total || 0) + (apPayments[0].$extras.total || 0)
      const netCashFlow = totalInflow - totalOutflow

      return response.ok({
        status: 'success',
        data: {
          period: { startDate, endDate },
          inflows: {
            arReceipts: arReceipts[0].$extras.total || 0,
            total: totalInflow
          },
          outflows: {
            expenses: expenses[0].$extras.total || 0,
            apPayments: apPayments[0].$extras.total || 0,
            total: totalOutflow
          },
          netCashFlow
        },
        message: 'Laporan arus kas berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil laporan arus kas'
      })
    }
  }

  async getTaxReport({ request, response }: HttpContext) {
    try {
      const startDate = request.input('startDate')
      const endDate = request.input('endDate')

      if (!startDate || !endDate) {
        return response.badRequest({
          status: 'error',
          message: 'Tanggal awal dan akhir diperlukan'
        })
      }

      // Ambil semua pajak aktif
      const activeTaxes = await Tax.query()
        .where('isActive', true)
        .orderBy('name', 'asc')

      // Hitung total transaksi yang terkait dengan pajak
      // Note: Ini adalah contoh sederhana, implementasi sebenarnya tergantung pada struktur data
      const taxSummary = activeTaxes.map(tax => ({
        id: tax.id,
        name: tax.name,
        code: tax.code,
        rate: tax.rate,
        type: tax.type,
        estimatedAmount: 0, // Ini perlu dihitung berdasarkan transaksi yang terkait
        description: `Pajak ${tax.name} (${tax.rate}%)`
      }))

      return response.ok({
        status: 'success',
        data: {
          period: { startDate, endDate },
          taxes: taxSummary,
          totalTaxes: taxSummary.length
        },
        message: 'Laporan pajak berhasil diambil'
      })
    } catch (error) {
      return response.internalServerError({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil laporan pajak'
      })
    }
  }
}
