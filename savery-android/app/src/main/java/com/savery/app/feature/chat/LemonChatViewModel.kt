package com.savery.app.feature.chat

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.content
import com.savery.app.domain.model.Bucket
import com.savery.app.domain.model.Transaction
import com.savery.app.domain.model.TransactionSource
import com.savery.app.domain.repository.TransactionRepository
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
private data class LogTransactionPayload(
    val amount: Double,
    val merchant: String,
    val category: String,
    val bucket: String? = null,
    val type: String? = "debit"
)

data class ChatMessage(val text: String, val isUser: Boolean)
data class ChatUiState(val messages: List<ChatMessage> = listOf(
    ChatMessage("Hi! I'm Lemon 🍋 — your AI financial guide. Ask me anything about your spending, savings, or budget. You can also tell me to log transactions, e.g. 'spent ₹350 on lunch at Swiggy'!", false)
), val isTyping: Boolean = false)

private const val TAG = "LemonChatViewModel"

@HiltViewModel
class LemonChatViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val transactionRepository: TransactionRepository,
    @Named("chat") private val geminiModel: GenerativeModel
) : ViewModel() {

    private val _uiState = MutableStateFlow(ChatUiState())
    val uiState = _uiState.asStateFlow()

    private var financialContext = ""

    init { buildFinancialContext() }

    private fun buildFinancialContext() {
        viewModelScope.launch {
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id ?: return@launch
                val month = java.time.LocalDate.now().toString().substring(0, 7) // "2026-05"

                val profile = supabaseClient.postgrest["user_profiles"]
                    .select { filter { eq("user_id", userId) } }
                    .decodeList<Map<String, JsonElement>>()
                    .firstOrNull()

                val name = profile?.get("full_name")?.jsonPrimitive?.content ?: "User"
                val income = profile?.get("monthly_income")?.jsonPrimitive?.doubleOrNull ?: 0.0

                val transactions = transactionRepository.getTransactionsByMonth(userId, month)
                val totalSpent = transactions.sumOf { it.amount }

                financialContext = "User Name: $name. User's monthly income: ₹$income. Total spent this month: ₹$totalSpent. Number of transactions tracked: ${transactions.size}."
                Log.d(TAG, "Financial context built: $financialContext")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to build financial context: ${e.message}")
            }
        }
    }

    fun sendMessage(text: String) {
        val userMsg = ChatMessage(text, true)
        _uiState.update { it.copy(messages = it.messages + userMsg, isTyping = true) }
        viewModelScope.launch {
            try {
                val systemPrompt = """You are Lemon, Savery's friendly, supportive, and clever AI financial guide for Indian users.
                    Context: $financialContext
                    Be extremely concise (2-3 sentences max), warm, empathetic, and specific. Use ₹ for currency.
                    
                    CRITICAL INSTRUCTION FOR CONVERSATIONAL TRANSACTION LOGGING:
                    If the user is asking to log a transaction (e.g., spent money, paid someone, received income, withdrew cash, or explicitly logged cash/expense), you MUST append this EXACT token at the end of your message on a new line (do not mention it in your normal reply, and do not show the raw token to the user):
                    [LOG_TRANSACTION: {"amount": 120.0, "merchant": "Merchant Name", "category": "Food & Dining", "bucket": "DISCRETIONARY", "type": "debit"}]

                    Valid buckets are: FIXED, ESSENTIAL, DISCRETIONARY.
                    Valid categories are: Food & Dining, Transport, Groceries, Shopping, Entertainment, Health & Wellness, Utilities, Rent, EMI, Insurance, Investment, Education, Personal Care, Travel, ATM Withdrawal, Transfer, Others.
                    Use your intelligence to guess the category and bucket based on the merchant or note.
                    If type is "credit", bucket is typically DISCRETIONARY.
                    """.trimIndent()

                val history = _uiState.value.messages.dropLast(1).map {
                    content(if (it.isUser) "user" else "model") { text(it.text) }
                }

                val chat = geminiModel.startChat(history = history)
                val response = chat.sendMessage("$systemPrompt\n\nUser: $text")

                var replyText = response.text ?: "I couldn't process that. Try again."
                Log.d(TAG, "Gemini reply: $replyText")

                // Intercept logging token
                val tagIndex = replyText.indexOf("[LOG_TRANSACTION:")
                if (tagIndex != -1) {
                    val tagEndIndex = replyText.indexOf("]", tagIndex)
                    if (tagEndIndex != -1) {
                        val jsonStr = replyText.substring(tagIndex + "[LOG_TRANSACTION:".length, tagEndIndex).trim()
                        // Strip the tag out of the UI response
                        replyText = (replyText.substring(0, tagIndex) + replyText.substring(tagEndIndex + 1)).trim()

                        try {
                            val json = Json { ignoreUnknownKeys = true }
                            val payload = json.decodeFromString<LogTransactionPayload>(jsonStr)

                            val userId = supabaseClient.auth.currentUserOrNull()?.id
                            if (userId != null) {
                                val dateStr = java.time.LocalDate.now().toString()
                                val tx = Transaction(
                                    userId = userId,
                                    merchant = payload.merchant,
                                    amount = payload.amount,
                                    category = payload.category,
                                    bucket = when (payload.bucket?.uppercase()) {
                                        "FIXED" -> Bucket.FIXED
                                        "ESSENTIAL" -> Bucket.ESSENTIAL
                                        else -> Bucket.DISCRETIONARY
                                    },
                                    date = dateStr,
                                    source = TransactionSource.MANUAL,
                                    needsReview = false
                                )
                                transactionRepository.insertTransaction(tx)
                                Log.d(TAG, "Auto-logged transaction via chat: $tx")
                                buildFinancialContext() // Rebuild context to reflect the change
                                replyText += " 🍋 (Logged: ₹${payload.amount} at ${payload.merchant})"
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Failed to parse/save chat transaction: ${e.message}", e)
                        }
                    }
                }

                val reply = ChatMessage(replyText, false)
                _uiState.update { it.copy(messages = it.messages + reply, isTyping = false) }
            } catch (e: Exception) {
                Log.e(TAG, "Error sending chat message: ${e.message}", e)
                val err = ChatMessage("Something went wrong. Please try again.", false)
                _uiState.update { it.copy(messages = it.messages + err, isTyping = false) }
            }
        }
    }
}
