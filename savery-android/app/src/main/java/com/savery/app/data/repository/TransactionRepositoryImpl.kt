package com.savery.app.data.repository

import com.savery.app.domain.model.Transaction
import com.savery.app.domain.repository.TransactionRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TransactionRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : TransactionRepository {

    override suspend fun insertTransaction(transaction: Transaction) {
        // Strip raw SMS before syncing — privacy: raw message text never reaches the server
        val clean = transaction.copy(rawSms = null)
        supabaseClient.postgrest["transactions"].insert(clean)
    }

    override suspend fun getTransactionsByMonth(
        userId: String,
        month: String
    ): List<Transaction> {
        return supabaseClient.postgrest["transactions"]
            .select {
                filter {
                    eq("user_id", userId)
                    gte("date", "$month-01")
                    lte("date", "$month-31")
                }
            }
            .decodeList()
    }

    override suspend fun getUnreviewedTransactions(userId: String): List<Transaction> {
        return supabaseClient.postgrest["transactions"]
            .select {
                filter {
                    eq("user_id", userId)
                    eq("needs_review", value = true)
                }
            }
            .decodeList()
    }

    override suspend fun updateTransaction(transaction: Transaction) {
        val clean = transaction.copy(rawSms = null)
        supabaseClient.postgrest["transactions"]
            .update(clean) {
                filter { eq("id", transaction.id) }
            }
    }

    override suspend fun deleteTransaction(id: String) {
        supabaseClient.postgrest["transactions"]
            .delete {
                filter { eq("id", id) }
            }
    }

    override suspend fun syncToSupabase(userId: String) {
        // Placeholder — full offline-first Room → Supabase sync in a future sprint
    }
}
