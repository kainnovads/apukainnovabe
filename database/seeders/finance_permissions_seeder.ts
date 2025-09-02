import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Permission from '#models/auth/permission'

export default class extends BaseSeeder {
  async run() {
    // Finance Permissions
    const financePermissions = [
      // Bank Accounts
      {
        name: 'view_bank_account',
        displayName: 'View Bank Account',
        description: 'Melihat daftar rekening bank',
        module: 'finance'
      },
      {
        name: 'create_bank_account',
        displayName: 'Create Bank Account',
        description: 'Membuat rekening bank baru',
        module: 'finance'
      },
      {
        name: 'edit_bank_account',
        displayName: 'Edit Bank Account',
        description: 'Mengedit rekening bank',
        module: 'finance'
      },
      {
        name: 'delete_bank_account',
        displayName: 'Delete Bank Account',
        description: 'Menghapus rekening bank',
        module: 'finance'
      },
      {
        name: 'show_bank_account',
        displayName: 'Show Bank Account',
        description: 'Melihat detail rekening bank',
        module: 'finance'
      },

      // Taxes
      {
        name: 'view_tax',
        displayName: 'View Tax',
        description: 'Melihat daftar pajak',
        module: 'finance'
      },
      {
        name: 'create_tax',
        displayName: 'Create Tax',
        description: 'Membuat pajak baru',
        module: 'finance'
      },
      {
        name: 'edit_tax',
        displayName: 'Edit Tax',
        description: 'Mengedit pajak',
        module: 'finance'
      },
      {
        name: 'delete_tax',
        displayName: 'Delete Tax',
        description: 'Menghapus pajak',
        module: 'finance'
      },
      {
        name: 'show_tax',
        displayName: 'Show Tax',
        description: 'Melihat detail pajak',
        module: 'finance'
      },

      // Expenses
      {
        name: 'view_expenses',
        displayName: 'View Expenses',
        description: 'Melihat daftar pengeluaran',
        module: 'finance'
      },
      {
        name: 'create_expenses',
        displayName: 'Create Expenses',
        description: 'Membuat pengeluaran baru',
        module: 'finance'
      },
      {
        name: 'edit_expenses',
        displayName: 'Edit Expenses',
        description: 'Mengedit pengeluaran',
        module: 'finance'
      },
      {
        name: 'delete_expenses',
        displayName: 'Delete Expenses',
        description: 'Menghapus pengeluaran',
        module: 'finance'
      },
      {
        name: 'show_expenses',
        displayName: 'Show Expenses',
        description: 'Melihat detail pengeluaran',
        module: 'finance'
      },

      // AP Payments
      {
        name: 'view_ap_payment',
        displayName: 'View AP Payment',
        description: 'Melihat daftar pembayaran hutang',
        module: 'finance'
      },
      {
        name: 'create_ap_payment',
        displayName: 'Create AP Payment',
        description: 'Membuat pembayaran hutang baru',
        module: 'finance'
      },
      {
        name: 'edit_ap_payment',
        displayName: 'Edit AP Payment',
        description: 'Mengedit pembayaran hutang',
        module: 'finance'
      },
      {
        name: 'delete_ap_payment',
        displayName: 'Delete AP Payment',
        description: 'Menghapus pembayaran hutang',
        module: 'finance'
      },
      {
        name: 'show_ap_payment',
        displayName: 'Show AP Payment',
        description: 'Melihat detail pembayaran hutang',
        module: 'finance'
      },

      // AR Receipts
      {
        name: 'view_ar_receipt',
        displayName: 'View AR Receipt',
        description: 'Melihat daftar penerimaan piutang',
        module: 'finance'
      },
      {
        name: 'create_ar_receipt',
        displayName: 'Create AR Receipt',
        description: 'Membuat penerimaan piutang baru',
        module: 'finance'
      },
      {
        name: 'edit_ar_receipt',
        displayName: 'Edit AR Receipt',
        description: 'Mengedit penerimaan piutang',
        module: 'finance'
      },
      {
        name: 'delete_ar_receipt',
        displayName: 'Delete AR Receipt',
        description: 'Menghapus penerimaan piutang',
        module: 'finance'
      },
      {
        name: 'show_ar_receipt',
        displayName: 'Show AR Receipt',
        description: 'Melihat detail penerimaan piutang',
        module: 'finance'
      },

      // Assets
      {
        name: 'view_asset',
        displayName: 'View Asset',
        description: 'Melihat daftar aset',
        module: 'finance'
      },
      {
        name: 'create_asset',
        displayName: 'Create Asset',
        description: 'Membuat aset baru',
        module: 'finance'
      },
      {
        name: 'edit_asset',
        displayName: 'Edit Asset',
        description: 'Mengedit aset',
        module: 'finance'
      },
      {
        name: 'delete_asset',
        displayName: 'Delete Asset',
        description: 'Menghapus aset',
        module: 'finance'
      },
      {
        name: 'show_asset',
        displayName: 'Show Asset',
        description: 'Melihat detail aset',
        module: 'finance'
      },

      // Accounts (Chart of Accounts)
      {
        name: 'view_account',
        displayName: 'View Account',
        description: 'Melihat daftar akun',
        module: 'finance'
      },
      {
        name: 'create_account',
        displayName: 'Create Account',
        description: 'Membuat akun baru',
        module: 'finance'
      },
      {
        name: 'edit_account',
        displayName: 'Edit Account',
        description: 'Mengedit akun',
        module: 'finance'
      },
      {
        name: 'delete_account',
        displayName: 'Delete Account',
        description: 'Menghapus akun',
        module: 'finance'
      },
      {
        name: 'show_account',
        displayName: 'Show Account',
        description: 'Melihat detail akun',
        module: 'finance'
      },

      // Journals
      {
        name: 'view_journal',
        displayName: 'View Journal',
        description: 'Melihat daftar jurnal',
        module: 'finance'
      },
      {
        name: 'create_journal',
        displayName: 'Create Journal',
        description: 'Membuat jurnal baru',
        module: 'finance'
      },
      {
        name: 'edit_journal',
        displayName: 'Edit Journal',
        description: 'Mengedit jurnal',
        module: 'finance'
      },
      {
        name: 'delete_journal',
        displayName: 'Delete Journal',
        description: 'Menghapus jurnal',
        module: 'finance'
      },
      {
        name: 'show_journal',
        displayName: 'Show Journal',
        description: 'Melihat detail jurnal',
        module: 'finance'
      },
      {
        name: 'post_journal',
        displayName: 'Post Journal',
        description: 'Posting jurnal',
        module: 'finance'
      },
      {
        name: 'cancel_journal',
        displayName: 'Cancel Journal',
        description: 'Membatalkan jurnal',
        module: 'finance'
      }
    ]

    // Insert permissions
    for (const permission of financePermissions) {
      await Permission.updateOrCreate(
        { name: permission.name },
        {
          name: permission.name,
        }
      )
    }

    console.log('✅ Finance permissions seeded successfully!')
  }
}
