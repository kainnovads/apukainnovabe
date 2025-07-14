import db from '@adonisjs/lucid/services/db'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class TransactionHelper {
  /**
   * Execute a function within a transaction
   * Automatically handles commit/rollback
   */
  static async withTransaction<T>(
    callback: (trx: TransactionClientContract) => Promise<T>
  ): Promise<T> {
    const trx = await db.transaction()

    try {
      const result = await callback(trx)
      await trx.commit()
      return result
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Execute a function within a transaction with custom error handling
   */
  static async withTransactionAndErrorHandler<T>(
    callback: (trx: TransactionClientContract) => Promise<T>,
    errorHandler?: (error: any, trx: TransactionClientContract) => Promise<void>
  ): Promise<T> {
    const trx = await db.transaction()

    try {
      const result = await callback(trx)
      await trx.commit()
      return result
    } catch (error) {
      await trx.rollback()

      if (errorHandler) {
        await errorHandler(error, trx)
      }

      throw error
    }
  }

  /**
   * Safe rollback - handles cases where transaction might already be closed
   */
  static async safeRollback(trx: TransactionClientContract): Promise<void> {
    try {
      if (trx && !trx.isCompleted) {
        await trx.rollback()
      }
    } catch (error) {
      console.error('Error during transaction rollback:', error)
    }
  }

  /**
   * Safe commit - handles cases where transaction might already be closed
   */
  static async safeCommit(trx: TransactionClientContract): Promise<void> {
    try {
      if (trx && !trx.isCompleted) {
        await trx.commit()
      }
    } catch (error) {
      console.error('Error during transaction commit:', error)
      throw error
    }
  }
}
