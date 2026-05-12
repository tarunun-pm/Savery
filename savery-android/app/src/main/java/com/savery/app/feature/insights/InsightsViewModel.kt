package com.savery.app.feature.insights

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import javax.inject.Inject
import javax.inject.Named

data class InsightsUiState(val insightText: String = "", val isLoading: Boolean = true)

@HiltViewModel
class InsightsViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient,
    @Named("chat") private val geminiModel: GenerativeModel
) : ViewModel() {

    private val _uiState = MutableStateFlow(InsightsUiState())
    val uiState = _uiState.asStateFlow()

    init { loadInsights() }

    private fun loadInsights() {
        viewModelScope.launch {
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id ?: return@launch
                val month = java.time.LocalDate.now().toString().substring(0, 7)

                val transactions = supabaseClient.postgrest["transactions"]
                    .select { filter { eq("user_id", userId); gte("date", "$month-01"); lte("date", "$month-31") }}
                    .decodeList<Map<String, kotlinx.serialization.json.JsonElement>>()

                if (transactions.isEmpty()) { _uiState.update { it.copy(isLoading = false) }; return@launch }

                val summary = transactions.groupBy { it["category"]?.jsonPrimitive?.content ?: "Others" }
                    .mapValues { (_, txns) -> txns.sumOf { it["amount"]?.jsonPrimitive?.doubleOrNull ?: 0.0 } }
                    .entries.sortedByDescending { it.value }
                    .take(5)
                    .joinToString(", ") { "${it.key}: ₹${it.value.toLong()}" }

                val prompt = """You are Savery, an AI financial coach for Indian users. 
                    Here are the user's top spending categories this month: $summary.
                    Give ONE concise, friendly insight (2-3 sentences max). Be specific with numbers. 
                    Don't be preachy. Focus on what's notable or actionable."""

                val response = geminiModel.generateContent(prompt)
                _uiState.update { it.copy(insightText = response.text ?: "", isLoading = false) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }
}
