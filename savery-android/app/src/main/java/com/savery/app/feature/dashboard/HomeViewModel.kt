package com.savery.app.feature.dashboard

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.jsonPrimitive
import javax.inject.Inject
import javax.inject.Named

@Serializable
private data class CategorySuggestion(
    val category: String,
    val bucket: String? = null
)

data class HomeUiState(
    val userName: String = "",
    val monthlyIncome: Double = 0.0,
    val totalSpent: Double = 0.0,
    val fixedTotal: Double = 0.0,
    val essentialTotal: Double = 0.0,
    val discretionaryTotal: Double = 0.0,
    val safeToSpend: Double = 0.0,
    val autoTrackedCount: Int = 0,
    val isLoading: Boolean = true,
    val error: String? = null
)

private const val TAG = "HomeViewModel"

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient,
    @Named("categorizer") private val categorizerModel: GenerativeModel
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState = _uiState.asStateFlow()

    private val _suggestedCategory = MutableStateFlow<String?>(null)
    val suggestedCategory = _suggestedCategory.asStateFlow()

    private val _suggestedBucket = MutableStateFlow<String?>(null)
    val suggestedBucket = _suggestedBucket.asStateFlow()

    init { loadDashboardData() }

    fun refresh() { loadDashboardData() }

    private fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id
                Log.d(TAG, "Loading dashboard for userId=$userId")

                if (userId == null) {
                    _uiState.update { it.copy(isLoading = false, error = "Not logged in") }
                    return@launch
                }

                // Load profile
                val profiles = supabaseClient.postgrest["user_profiles"]
                    .select { filter { eq("user_id", userId) } }
                    .decodeList<Map<String, JsonElement>>()

                val profile = profiles.firstOrNull()
                val name = profile?.get("full_name")?.jsonPrimitive?.content ?: ""
                val income = profile?.get("monthly_income")?.jsonPrimitive?.doubleOrNull ?: 0.0

                // Load this month's transactions
                val month = java.time.LocalDate.now().toString().substring(0, 7) // "2026-05"

                val transactions = supabaseClient.postgrest["transactions"]
                    .select {
                        filter {
                            eq("user_id", userId)
                            gte("date", "$month-01")
                            lte("date", "$month-31")
                        }
                    }
                    .decodeList<Map<String, JsonElement>>()

                var fixed = 0.0
                var essential = 0.0
                var discretionary = 0.0
                var autoCount = 0

                transactions.forEach { tx ->
                    // Exclude unreviewed ones from current spending totals
                    val needsReview = tx["needs_review"]?.jsonPrimitive?.content?.toBoolean() ?: false
                    if (!needsReview) {
                        val amount = tx["amount"]?.jsonPrimitive?.doubleOrNull ?: 0.0
                        val bucket = tx["bucket"]?.jsonPrimitive?.content?.uppercase() ?: "DISCRETIONARY"
                        val source = tx["source"]?.jsonPrimitive?.content?.uppercase() ?: "MANUAL"
                        if (source == "SMS") autoCount++
                        when (bucket) {
                            "FIXED" -> fixed += amount
                            "ESSENTIAL" -> essential += amount
                            else -> discretionary += amount
                        }
                    }
                }

                // Load commitments
                val commitments = try {
                    supabaseClient.postgrest["user_commitments"]
                        .select { filter { eq("user_id", userId) } }
                        .decodeList<Map<String, JsonElement>>()
                } catch (e: Exception) {
                    Log.w(TAG, "user_commitments fetch failed: ${e.message}")
                    emptyList()
                }

                val totalCommitments = commitments.sumOf {
                    it["amount"]?.jsonPrimitive?.doubleOrNull ?: 0.0
                }

                val totalSpent = fixed + essential + discretionary
                val daysInMonth = java.time.YearMonth.now().lengthOfMonth()
                val dayOfMonth = java.time.LocalDate.now().dayOfMonth

                val remaining = (income - totalCommitments - totalSpent).coerceAtLeast(0.0)
                val remainingDays = (daysInMonth - dayOfMonth + 1).coerceAtLeast(1)
                val safeToSpendToday = remaining / remainingDays

                _uiState.update {
                    it.copy(
                        userName = name,
                        monthlyIncome = income,
                        totalSpent = totalSpent,
                        fixedTotal = fixed,
                        essentialTotal = essential,
                        discretionaryTotal = discretionary,
                        safeToSpend = safeToSpendToday,
                        autoTrackedCount = autoCount,
                        isLoading = false
                    )
                }

            } catch (e: Exception) {
                Log.e(TAG, "Dashboard load failed: ${e.message}", e)
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }

    fun suggestCategoryAndBucket(merchant: String) {
        if (merchant.isBlank()) {
            _suggestedCategory.value = null
            _suggestedBucket.value = null
            return
        }
        viewModelScope.launch {
            try {
                val response = categorizerModel.generateContent("Merchant: $merchant")
                val text = response.text?.trim() ?: ""
                Log.d(TAG, "Gemini Suggestion for '$merchant': $text")

                // Extract JSON if model wrapped it in ```json ... ```
                val cleanJson = if (text.startsWith("```")) {
                    text.substringAfter("```json").substringAfter("```").substringBeforeLast("```").trim()
                } else text

                val parsed = Json { ignoreUnknownKeys = true }.decodeFromString<CategorySuggestion>(cleanJson)
                _suggestedCategory.value = parsed.category
                _suggestedBucket.value = parsed.bucket?.uppercase() ?: "DISCRETIONARY"
            } catch (e: Exception) {
                Log.w(TAG, "Failed to suggest category for '$merchant': ${e.message}")
            }
        }
    }

    fun logTransaction(
        merchant: String,
        amount: Double,
        category: String,
        bucket: String,
        onCompleted: () -> Unit
    ) {
        viewModelScope.launch {
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id ?: return@launch
                val dateStr = java.time.LocalDate.now().toString()

                val payload = mapOf(
                    "user_id" to userId,
                    "merchant" to merchant,
                    "amount" to amount,
                    "category" to category,
                    "bucket" to bucket.uppercase(),
                    "date" to dateStr,
                    "source" to "MANUAL",
                    "needs_review" to false
                )

                supabaseClient.postgrest["transactions"].insert(payload)
                Log.d(TAG, "Manually logged transaction: $payload")
                loadDashboardData() // Refresh dashboard data immediately
                onCompleted()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to log transaction: ${e.message}", e)
            }
        }
    }
}
