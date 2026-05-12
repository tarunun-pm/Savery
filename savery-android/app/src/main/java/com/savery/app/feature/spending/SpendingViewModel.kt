package com.savery.app.feature.spending

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.savery.app.domain.model.Transaction
import com.savery.app.domain.repository.TransactionRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonPrimitive
import javax.inject.Inject

data class MerchantSpent(val merchant: String, val amount: Double)

data class SpendingUiState(
    val totalSpent: Double = 0.0,
    val income: Double = 0.0,
    val categories: Map<String, Double> = emptyMap(),
    val topMerchants: List<MerchantSpent> = emptyList(),
    val recentTransactions: List<Transaction> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

private const val TAG = "SpendingViewModel"

@HiltViewModel
class SpendingViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val transactionRepository: TransactionRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SpendingUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadSpending()
    }

    fun loadSpending() {
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id
                if (userId == null) {
                    _uiState.update { it.copy(isLoading = false, error = "User not logged in") }
                    return@launch
                }
                val month = java.time.LocalDate.now().toString().substring(0, 7) // "2026-05"

                // 1. Fetch User Profile for monthly income
                val profileResult = supabaseClient.postgrest["user_profiles"]
                    .select { filter { eq("user_id", userId) } }
                    .decodeList<Map<String, JsonElement>>()
                    .firstOrNull()
                val income = profileResult?.get("monthly_income")?.jsonPrimitive?.doubleOrNull ?: 0.0

                // 2. Fetch current month's transactions
                val transactions = transactionRepository.getTransactionsByMonth(userId, month)
                    .filter { !it.needsReview } // Only count confirmed transactions

                // Calculate Category Wise Spending
                val categoryMap = mutableMapOf<String, Double>()
                // Calculate Merchant Wise Spending
                val merchantMap = mutableMapOf<String, Double>()
                var total = 0.0

                transactions.forEach { tx ->
                    categoryMap[tx.category] = (categoryMap[tx.category] ?: 0.0) + tx.amount
                    merchantMap[tx.merchant] = (merchantMap[tx.merchant] ?: 0.0) + tx.amount
                    total += tx.amount
                }

                // Sort categories and merchants descending
                val sortedCategories = categoryMap.toList()
                    .sortedByDescending { it.second }
                    .toMap()

                val sortedMerchants = merchantMap.toList()
                    .sortedByDescending { it.second }
                    .take(5)
                    .map { MerchantSpent(it.first, it.second) }

                _uiState.update {
                    it.copy(
                        totalSpent = total,
                        income = income,
                        categories = sortedCategories,
                        topMerchants = sortedMerchants,
                        recentTransactions = transactions.sortedByDescending { t -> t.date },
                        isLoading = false
                    )
                }
                Log.d(TAG, "Spending data loaded. Total spend: ₹$total")
            } catch (e: Exception) {
                Log.e(TAG, "Error loading spending info: ${e.message}", e)
                _uiState.update { it.copy(isLoading = false, error = "Failed to load spending details") }
            }
        }
    }
}
