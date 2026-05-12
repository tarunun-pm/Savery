package com.savery.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * A financial transaction — created manually, from CSV, or auto-captured from SMS
 */
@Serializable
data class Transaction(
    @SerialName("id") val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("merchant") val merchant: String,
    @SerialName("amount") val amount: Double,
    @SerialName("category") val category: String,
    @SerialName("sub_category") val subcategory: String? = null,
    @SerialName("bucket") val bucket: Bucket = Bucket.DISCRETIONARY,
    @SerialName("date") val date: String,          // ISO 8601: "2026-05-11"
    @SerialName("source") val source: TransactionSource = TransactionSource.MANUAL,
    @SerialName("confidence") val confidence: Float = 1.0f,
    @SerialName("needs_review") val needsReview: Boolean = false,
    @SerialName("notes") val notes: String? = null,
    @SerialName("raw_sms") val rawSms: String? = null // Only stored locally, never sent to Supabase
)

@Serializable
enum class Bucket {
    FIXED, ESSENTIAL, DISCRETIONARY;

    val label: String get() = when (this) {
        FIXED -> "Fixed"
        ESSENTIAL -> "Essential"
        DISCRETIONARY -> "Discretionary"
    }
}

@Serializable
enum class TransactionSource {
    MANUAL, SMS, CSV, VOICE
}
