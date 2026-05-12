package com.savery.app.domain.repository

import com.savery.app.domain.model.Transaction

interface TransactionRepository {
    suspend fun insertTransaction(transaction: Transaction)
    suspend fun getTransactionsByMonth(userId: String, month: String): List<Transaction>
    suspend fun getUnreviewedTransactions(userId: String): List<Transaction>
    suspend fun updateTransaction(transaction: Transaction)
    suspend fun deleteTransaction(id: String)
    suspend fun syncToSupabase(userId: String)
}
