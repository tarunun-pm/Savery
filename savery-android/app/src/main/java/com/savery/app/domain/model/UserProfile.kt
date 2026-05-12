package com.savery.app.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    @SerialName("user_id") val userId: String = "",
    @SerialName("full_name") val fullName: String = "",
    @SerialName("persona") val persona: Persona = Persona.SALARIED,
    @SerialName("monthly_income") val monthlyIncome: Double = 0.0
)

@Serializable
enum class Persona {
    SALARIED, FREELANCER, FAMILY
}

@Serializable
data class Commitment(
    @SerialName("id") val id: String = "",
    @SerialName("user_id") val userId: String = "",
    @SerialName("label") val label: String,
    @SerialName("amount") val amount: Double,
    @SerialName("category") val category: String = "Others"
)

/**
 * Calculated snapshot of the current month's financial state.
 * Derived from income, commitments, and transactions — not stored in DB.
 */
data class MonthSnapshot(
    val income: Double,
    val totalCommitments: Double,
    val totalSpent: Double,
    val fixedTotal: Double,
    val essentialTotal: Double,
    val discretionaryTotal: Double,
    val safeToSpend: Double,
    val categories: Map<String, Double>
)
