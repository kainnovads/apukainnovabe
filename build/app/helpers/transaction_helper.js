import db from '@adonisjs/lucid/services/db';
export class TransactionHelper {
    static async withTransaction(callback) {
        const trx = await db.transaction();
        try {
            const result = await callback(trx);
            await trx.commit();
            return result;
        }
        catch (error) {
            await trx.rollback();
            throw error;
        }
    }
    static async withTransactionAndErrorHandler(callback, errorHandler) {
        const trx = await db.transaction();
        try {
            const result = await callback(trx);
            await trx.commit();
            return result;
        }
        catch (error) {
            await trx.rollback();
            if (errorHandler) {
                await errorHandler(error, trx);
            }
            throw error;
        }
    }
    static async safeRollback(trx) {
        try {
            if (trx && !trx.isCompleted) {
                await trx.rollback();
            }
        }
        catch (error) {
            console.error('Error during transaction rollback:', error);
        }
    }
    static async safeCommit(trx) {
        try {
            if (trx && !trx.isCompleted) {
                await trx.commit();
            }
        }
        catch (error) {
            console.error('Error during transaction commit:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=transaction_helper.js.map