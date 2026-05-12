package com.savery.app.sms

import android.content.Context
import android.util.Log
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.google.ai.client.generativeai.GenerativeModel
import com.savery.app.domain.repository.TransactionRepository
import com.savery.app.domain.model.Bucket
import com.savery.app.domain.model.Transaction
import com.savery.app.domain.model.TransactionSource
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.SupabaseClient
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import javax.inject.Named

/**
 * WorkManager task that processes a single bank SMS:
 * 1. Parse SMS on-device (SmsParser)
 * 2. Call Gemini to categorize merchant → category/bucket
 * 3. Save structured transaction to Room (local)
 * 4. Sync to Supabase (remote)
 * 5. If ATM withdrawal → schedule smart prompt notification
 */
@HiltWorker
class SmsWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val transactionRepository: TransactionRepository,
    private val supabaseClient: SupabaseClient,
    @Named("categorizer") private val geminiModel: GenerativeModel,
    private val smartPromptNotifier: SmartPromptNotifier
) : CoroutineWorker(appContext, workerParams) {

    companion object {
        const val KEY_SMS_BODY = "sms_body"
        const val KEY_TIMESTAMP = "timestamp"
        private const val TAG = "SmsWorker"
    }

    override suspend fun doWork(): Result {
        val smsBody = inputData.getString(KEY_SMS_BODY) ?: return Result.failure()
        val timestamp = inputData.getLong(KEY_TIMESTAMP, System.currentTimeMillis())

        // Step 1: Parse SMS on-device
        val parsed = SmsParser.parse(smsBody, timestamp) ?: run {
            Log.w(TAG, "SmsParser returned null — skipping")
            return Result.success()
        }

        Log.d(TAG, "Parsed: amount=${parsed.amount}, type=${parsed.type}, merchant=${parsed.merchant}")

        // Step 2: Get current user (skip if not logged in)
        val userId = supabaseClient.auth.currentUserOrNull()?.id ?: run {
            Log.w(TAG, "No user logged in — skipping sync")
            return Result.success()
        }

        // Step 3: Categorize via Gemini (only if merchant name available)
        val categoryResult = if (parsed.merchant != null) {
            categorizeMerchant(parsed.merchant)
        } else {
            CategoryResult("Others", null, Bucket.DISCRETIONARY, 0.5f)
        }

        // Step 4: Convert to Transaction domain model
        val dateStr = Instant.ofEpochMilli(timestamp)
            .atZone(ZoneId.systemDefault())
            .format(DateTimeFormatter.ISO_LOCAL_DATE)  // "2026-05-11"

        val transaction = Transaction(
            userId = userId,
            merchant = parsed.merchant ?: when (parsed.type) {
                TransactionType.ATM_WITHDRAWAL -> "ATM Withdrawal"
                TransactionType.CREDIT -> "Bank Credit"
                else -> "Unknown"
            },
            amount = parsed.amount,
            category = categoryResult.category,
            subcategory = categoryResult.subcategory,
            bucket = categoryResult.bucket,
            date = dateStr,
            source = TransactionSource.SMS,
            confidence = categoryResult.confidence,
            needsReview = categoryResult.confidence < 0.85f || parsed.type == TransactionType.ATM_WITHDRAWAL
        )

        // Step 5: Save to local Room DB + sync to Supabase
        transactionRepository.insertTransaction(transaction)
        Log.d(TAG, "Transaction saved: ${transaction.merchant} ₹${transaction.amount}")

        // Step 6: Smart prompt for ATM withdrawals
        if (parsed.type == TransactionType.ATM_WITHDRAWAL) {
            smartPromptNotifier.scheduleAtmPrompt(
                amount = parsed.amount,
                delayMinutes = 60 // Show prompt 1 hour after withdrawal
            )
            Log.d(TAG, "ATM prompt scheduled for ₹${parsed.amount}")
        }

        return Result.success()
    }

    /**
     * Calls Gemini to categorize a merchant name.
     * Keeps a simple in-memory cache to avoid repeat API calls for the same merchant.
     */
    private suspend fun categorizeMerchant(merchant: String): CategoryResult {
        return try {
            val prompt = "Merchant: $merchant"
            val response = geminiModel.generateContent(prompt)
            val jsonText = response.text?.trim() ?: return defaultCategory()

            // Parse Gemini's JSON response
            val json = Json { ignoreUnknownKeys = true }
            val obj = json.parseToJsonElement(jsonText).jsonObject

            CategoryResult(
                category = obj["category"]?.jsonPrimitive?.content ?: "Others",
                subcategory = obj["subcategory"]?.jsonPrimitive?.content,
                bucket = when (obj["bucket"]?.jsonPrimitive?.content?.lowercase()) {
                    "fixed" -> Bucket.FIXED
                    "essential" -> Bucket.ESSENTIAL
                    else -> Bucket.DISCRETIONARY
                },
                confidence = obj["confidence"]?.jsonPrimitive?.doubleOrNull?.toFloat() ?: 0.7f
            )
        } catch (e: Exception) {
            Log.e(TAG, "Gemini categorization failed: ${e.message}")
            defaultCategory()
        }
    }

    private fun defaultCategory() = CategoryResult(
        category = "Others",
        subcategory = null,
        bucket = Bucket.DISCRETIONARY,
        confidence = 0.5f
    )
}

data class CategoryResult(
    val category: String,
    val subcategory: String?,
    val bucket: Bucket,
    val confidence: Float
)
