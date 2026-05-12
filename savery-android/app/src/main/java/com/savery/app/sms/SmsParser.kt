package com.savery.app.sms

import android.util.Log

/**
 * On-device SMS parser for Indian bank messages.
 * Runs entirely locally — no raw SMS ever leaves the device.
 *
 * Supported formats:
 * - HDFC Bank debit/credit
 * - SBI debit/credit
 * - ICICI, Axis, Kotak, PNB, Canara
 * - UPI payments (GPay, PhonePe, Paytm, BHIM)
 * - ATM withdrawals
 * - Credit card transactions
 */
object SmsParser {

    private const val TAG = "SmsParser"

    // ── Regex Patterns ──────────────────────────────────────────────────────

    // Match debit transactions: "debited", "deducted", "spent", "paid"
    private val DEBIT_PATTERN = Regex(
        """(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is\s+)?(?:debited|deducted|spent|paid|withdrawn)""",
        RegexOption.IGNORE_CASE
    )

    // Alternative debit: "debited Rs. 500 from"
    private val DEBIT_ALT_PATTERN = Regex(
        """(?:debited|deducted)\s+(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE
    )

    // Credit transactions: "credited", "received"
    private val CREDIT_PATTERN = Regex(
        """(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:is\s+)?(?:credited|received|deposited)""",
        RegexOption.IGNORE_CASE
    )

    // ATM withdrawal detection
    private val ATM_PATTERN = Regex(
        """(?:ATM|cash\s+withdrawal|withdrawn\s+at\s+ATM)""",
        RegexOption.IGNORE_CASE
    )

    // UPI payment
    private val UPI_PATTERN = Regex(
        """(?:UPI|BHIM|GPay|Google\s*Pay|PhonePe|Paytm)""",
        RegexOption.IGNORE_CASE
    )

    // Merchant/payee extraction: "at MERCHANT" or "to MERCHANT"
    private val MERCHANT_AT_PATTERN = Regex(
        """(?:at|At)\s+([A-Z][A-Za-z0-9\s&\-\.]{2,30})(?:\.|,|\s+on|\s+Ref|\s+Info|$)"""
    )

    private val MERCHANT_TO_PATTERN = Regex(
        """(?:to|To)\s+([A-Z][A-Za-z0-9\s&\-\.]{2,30})(?:\.|,|\s+via|\s+Ref|\s+UPI|$)"""
    )

    // Balance extraction: "Bal Rs.24,500.00" or "Avl Bal: 24500"
    private val BALANCE_PATTERN = Regex(
        """(?:Bal|Balance|Avl\s*Bal|Available\s*Balance)\s*:?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)""",
        RegexOption.IGNORE_CASE
    )

    // Bank sender ID patterns (known Indian bank SMS senders)
    private val BANK_SENDER_IDS = setOf(
        "HDFCBK", "SBIINB", "ICICIB", "AXISBK", "KOTAKB",
        "PNBSMS", "CANBNK", "BOIIND", "CENTBK", "UNIONB",
        "YESBNK", "IDBIBK", "INDBNK", "SCBANK", "CITIBNK",
        "PAYTMB", "PHONEPE", "GPAY", "BHARPE", "AMAZON"
    )

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Checks if an SMS is from a known financial source.
     * Broadened: keyword match alone is sufficient — many Indian bank SMS
     * use non-standard amount formats that the regex won't catch.
     */
    fun isBankSms(body: String): Boolean {
        Log.d(TAG, "Checking SMS: ${body.take(80)}...")

        val hasFinancialKeywords =
            body.contains("debited", ignoreCase = true) ||
            body.contains("credited", ignoreCase = true) ||
            body.contains("withdrawn", ignoreCase = true) ||
            body.contains("UPI", ignoreCase = true) ||
            body.contains("payment", ignoreCase = true) ||
            body.contains("transaction", ignoreCase = true) ||
            body.contains("INR", ignoreCase = true) ||
            body.contains("Rs.", ignoreCase = true) ||
            body.contains("₹")

        val hasAmountPattern =
            DEBIT_PATTERN.containsMatchIn(body) ||
            DEBIT_ALT_PATTERN.containsMatchIn(body) ||
            CREDIT_PATTERN.containsMatchIn(body)

        // Accept if keywords match (regex is optional — many real SMS don't match strictly)
        val result = hasFinancialKeywords || hasAmountPattern
        Log.d(TAG, "isBankSms=$result (keywords=$hasFinancialKeywords, regex=$hasAmountPattern)")
        return result
    }

    /**
     * Parses a bank SMS into a structured ParsedSms object.
     * Returns null if parsing fails.
     */
    fun parse(body: String, timestamp: Long = System.currentTimeMillis()): ParsedSms? {
        return try {
            val type = detectTransactionType(body)
            val amount = extractAmount(body, type) ?: return null
            val merchant = extractMerchant(body)
            val balance = extractBalance(body)

            ParsedSms(
                amount = amount,
                type = type,
                merchant = merchant,
                balance = balance,
                rawSms = body,   // Stored only in Room, never synced to Supabase
                timestamp = timestamp
            )
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse SMS: ${e.message}")
            null
        }
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private fun detectTransactionType(body: String): TransactionType {
        return when {
            ATM_PATTERN.containsMatchIn(body) -> TransactionType.ATM_WITHDRAWAL
            body.contains("credited", ignoreCase = true) ||
                    body.contains("received", ignoreCase = true) -> TransactionType.CREDIT
            else -> TransactionType.DEBIT
        }
    }

    private fun extractAmount(body: String, type: TransactionType): Double? {
        val pattern = if (type == TransactionType.CREDIT) CREDIT_PATTERN else DEBIT_PATTERN
        val match = pattern.find(body) ?: DEBIT_ALT_PATTERN.find(body) ?: return null
        return match.groupValues[1]
            .replace(",", "")
            .toDoubleOrNull()
    }

    private fun extractMerchant(body: String): String? {
        // Try "at MERCHANT" first (most common in debit SMS)
        val atMatch = MERCHANT_AT_PATTERN.find(body)
        if (atMatch != null) return atMatch.groupValues[1].trim()

        // Try "to MERCHANT" (UPI payments)
        val toMatch = MERCHANT_TO_PATTERN.find(body)
        if (toMatch != null) return toMatch.groupValues[1].trim()

        // UPI fallback — extract VPA (e.g., merchant@okicici)
        val vpaMatch = Regex("""[\w.\-]+@[\w]+""").find(body)
        if (vpaMatch != null) return vpaMatch.value

        return null
    }

    private fun extractBalance(body: String): Double? {
        val match = BALANCE_PATTERN.find(body) ?: return null
        return match.groupValues[1]
            .replace(",", "")
            .toDoubleOrNull()
    }
}

// ── Data Classes ─────────────────────────────────────────────────────────────

data class ParsedSms(
    val amount: Double,
    val type: TransactionType,
    val merchant: String?,
    val balance: Double?,
    val rawSms: String,        // Never leaves device
    val timestamp: Long
)

enum class TransactionType {
    DEBIT,          // Regular expense
    CREDIT,         // Income / refund
    ATM_WITHDRAWAL  // Cash — needs smart prompt
}
