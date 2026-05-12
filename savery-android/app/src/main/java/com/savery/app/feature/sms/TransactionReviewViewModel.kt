package com.savery.app.feature.sms

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.savery.app.domain.model.Bucket
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

data class ReviewItem(
    val id: String,
    val merchant: String,
    val amount: Double,
    val category: String,
    val date: String
)

data class ReviewUiState(
    val items: List<ReviewItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

private const val TAG = "TransactionReviewVM"

@HiltViewModel
class TransactionReviewViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(ReviewUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadUnreviewed()
    }

    fun loadUnreviewed() {
        _uiState.update { it.copy(isLoading = true, error = null) }
        viewModelScope.launch {
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id
                if (userId == null) {
                    _uiState.update { it.copy(isLoading = false, error = "User not logged in") }
                    return@launch
                }

                val results = supabaseClient.postgrest["transactions"]
                    .select {
                        filter {
                            eq("user_id", userId)
                            eq("needs_review", true)
                        }
                    }
                    .decodeList<Map<String, JsonElement>>()

                val mapped = results.map { tx ->
                    ReviewItem(
                        id = tx["id"]?.jsonPrimitive?.content ?: "",
                        merchant = tx["merchant"]?.jsonPrimitive?.content ?: "Unknown",
                        amount = tx["amount"]?.jsonPrimitive?.doubleOrNull ?: 0.0,
                        category = tx["category"]?.jsonPrimitive?.content ?: "Others",
                        date = tx["date"]?.jsonPrimitive?.content?.take(10) ?: ""
                    )
                }.sortedByDescending { it.date }

                _uiState.update { it.copy(items = mapped, isLoading = false) }
                Log.d(TAG, "Loaded ${mapped.size} unreviewed transactions")
            } catch (e: Exception) {
                Log.e(TAG, "Error loading unreviewed transactions: ${e.message}", e)
                _uiState.update { it.copy(isLoading = false, error = "Failed to load transactions: ${e.localizedMessage}") }
            }
        }
    }

    fun confirmTransaction(id: String) {
        viewModelScope.launch {
            try {
                supabaseClient.postgrest["transactions"].update({
                    set("needs_review", false)
                }) {
                    filter { eq("id", id) }
                }
                _uiState.update { it.copy(items = it.items.filter { item -> item.id != id }) }
                Log.d(TAG, "Confirmed transaction: $id")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to confirm transaction: ${e.message}")
            }
        }
    }

    fun deleteTransaction(id: String) {
        viewModelScope.launch {
            try {
                supabaseClient.postgrest["transactions"].delete {
                    filter { eq("id", id) }
                }
                _uiState.update { it.copy(items = it.items.filter { item -> item.id != id }) }
                Log.d(TAG, "Deleted transaction: $id")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to delete transaction: ${e.message}")
            }
        }
    }

    fun updateCategory(id: String, newCategory: String) {
        // Map category to appropriate budget bucket
        val bucket = when (newCategory) {
            "Rent", "EMI", "Insurance", "Utilities" -> "fixed"
            "Groceries", "Transport", "Health & Wellness", "Education", "ATM Withdrawal", "Transfer" -> "essential"
            else -> "discretionary"
        }

        viewModelScope.launch {
            try {
                supabaseClient.postgrest["transactions"].update({
                    set("category", newCategory)
                    set("bucket", bucket)
                    set("needs_review", false) // Auto confirm when manually classified
                }) {
                    filter { eq("id", id) }
                }
                _uiState.update { it.copy(items = it.items.filter { item -> item.id != id }) }
                Log.d(TAG, "Updated transaction $id category to $newCategory ($bucket)")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update category: ${e.message}")
            }
        }
    }

    fun confirmAll(onDone: () -> Unit) {
        viewModelScope.launch {
            try {
                val ids = _uiState.value.items.map { it.id }
                if (ids.isNotEmpty()) {
                    supabaseClient.postgrest["transactions"].update({
                        set("needs_review", false)
                    }) {
                        filter { isIn("id", ids) }
                    }
                }
                onDone()
            } catch (e: Exception) {
                Log.e(TAG, "Error confirming all transactions: ${e.message}")
                onDone()
            }
        }
    }
}
