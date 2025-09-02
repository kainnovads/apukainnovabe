import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Account from '#models/account'

export default class extends BaseSeeder {
  async run() {
    // Level 1 - Parent Accounts
    const parentAccounts = [
      {
        code: '1',
        name: 'Assets',
        category: 'asset',
        normalBalance: 'debit',
        isParent: true,
        parentId: null,
        level: 1
      },
      {
        code: '2',
        name: 'Liabilities',
        category: 'liability',
        normalBalance: 'credit',
        isParent: true,
        parentId: null,
        level: 1
      },
      {
        code: '3',
        name: 'Equity',
        category: 'equity',
        normalBalance: 'credit',
        isParent: true,
        parentId: null,
        level: 1
      },
      {
        code: '4',
        name: 'Revenue',
        category: 'revenue',
        normalBalance: 'credit',
        isParent: true,
        parentId: null,
        level: 1
      },
      {
        code: '5',
        name: 'Expenses',
        category: 'expense',
        normalBalance: 'debit',
        isParent: true,
        parentId: null,
        level: 1
      }
    ]

    // Create parent accounts
    const createdParents = []
    for (const parentAccount of parentAccounts) {
      const account = await Account.updateOrCreate(
        { code: parentAccount.code },
        parentAccount
      )
      createdParents.push(account)
    }

    // Level 2 - Sub Accounts
    const subAccounts = [
      // Assets
      {
        code: '1-1000',
        name: 'Current Assets',
        category: 'asset',
        normalBalance: 'debit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '1')?.id,
        level: 2
      },
      {
        code: '1-2000',
        name: 'Fixed Assets',
        category: 'asset',
        normalBalance: 'debit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '1')?.id,
        level: 2
      },

      // Liabilities
      {
        code: '2-1000',
        name: 'Current Liabilities',
        category: 'liability',
        normalBalance: 'credit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '2')?.id,
        level: 2
      },
      {
        code: '2-2000',
        name: 'Long Term Liabilities',
        category: 'liability',
        normalBalance: 'credit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '2')?.id,
        level: 2
      },

      // Equity
      {
        code: '3-1000',
        name: 'Owner Equity',
        category: 'equity',
        normalBalance: 'credit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '3')?.id,
        level: 2
      },

      // Revenue
      {
        code: '4-1000',
        name: 'Operating Revenue',
        category: 'revenue',
        normalBalance: 'credit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '4')?.id,
        level: 2
      },
      {
        code: '4-2000',
        name: 'Other Revenue',
        category: 'revenue',
        normalBalance: 'credit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '4')?.id,
        level: 2
      },

      // Expenses
      {
        code: '5-1000',
        name: 'Operating Expenses',
        category: 'expense',
        normalBalance: 'debit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '5')?.id,
        level: 2
      },
      {
        code: '5-2000',
        name: 'Other Expenses',
        category: 'expense',
        normalBalance: 'debit',
        isParent: true,
        parentId: createdParents.find(p => p.code === '5')?.id,
        level: 2
      }
    ]

    // Create sub accounts
    const createdSubs = []
    for (const subAccount of subAccounts) {
      const account = await Account.updateOrCreate(
        { code: subAccount.code },
        subAccount
      )
      createdSubs.push(account)
    }

    // Level 3 - Detail Accounts
    const detailAccounts = [
      // Current Assets
      {
        code: '1-1001',
        name: 'Cash',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-1000')?.id,
        level: 3
      },
      {
        code: '1-1002',
        name: 'Bank',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-1000')?.id,
        level: 3
      },
      {
        code: '1-1003',
        name: 'Accounts Receivable',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-1000')?.id,
        level: 3
      },
      {
        code: '1-1004',
        name: 'Inventory',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-1000')?.id,
        level: 3
      },

      // Fixed Assets
      {
        code: '1-2001',
        name: 'Equipment',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-2000')?.id,
        level: 3
      },
      {
        code: '1-2002',
        name: 'Buildings',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-2000')?.id,
        level: 3
      },
      {
        code: '1-2003',
        name: 'Vehicles',
        category: 'asset',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '1-2000')?.id,
        level: 3
      },

      // Current Liabilities
      {
        code: '2-1001',
        name: 'Accounts Payable',
        category: 'liability',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '2-1000')?.id,
        level: 3
      },
      {
        code: '2-1002',
        name: 'Short Term Loans',
        category: 'liability',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '2-1000')?.id,
        level: 3
      },

      // Owner Equity
      {
        code: '3-1001',
        name: 'Owner Investment',
        category: 'equity',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '3-1000')?.id,
        level: 3
      },
      {
        code: '3-1002',
        name: 'Retained Earnings',
        category: 'equity',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '3-1000')?.id,
        level: 3
      },

      // Operating Revenue
      {
        code: '4-1001',
        name: 'Sales Revenue',
        category: 'revenue',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '4-1000')?.id,
        level: 3
      },
      {
        code: '4-1002',
        name: 'Service Revenue',
        category: 'revenue',
        normalBalance: 'credit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '4-1000')?.id,
        level: 3
      },

      // Operating Expenses
      {
        code: '5-1001',
        name: 'Cost of Goods Sold',
        category: 'expense',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '5-1000')?.id,
        level: 3
      },
      {
        code: '5-1002',
        name: 'Salaries and Wages',
        category: 'expense',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '5-1000')?.id,
        level: 3
      },
      {
        code: '5-1003',
        name: 'Rent Expense',
        category: 'expense',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '5-1000')?.id,
        level: 3
      },
      {
        code: '5-1004',
        name: 'Utilities Expense',
        category: 'expense',
        normalBalance: 'debit',
        isParent: false,
        parentId: createdSubs.find(s => s.code === '5-1000')?.id,
        level: 3
      }
    ]

    // Create detail accounts
    for (const detailAccount of detailAccounts) {
      await Account.updateOrCreate(
        { code: detailAccount.code },
        detailAccount
      )
    }

    console.log('✅ Chart of Accounts seeded successfully!')
  }
}
