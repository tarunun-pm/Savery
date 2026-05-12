package com.savery.app.feature.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.savery.app.core.preferences.AppPreferences
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import javax.inject.Inject

// Typed model for Supabase upsert — avoids Map<String, Any> serialization error
@Serializable
private data class UserProfilePayload(
    @SerialName("user_id")        val userId: String,
    @SerialName("full_name")      val fullName: String,
    @SerialName("monthly_income") val monthlyIncome: Double
)

data class OnboardingUiState(
    val step: Int = 0,            // 0=Welcome, 1=Name, 2=Income
    val name: String = "",
    val income: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isDone: Boolean = false
)

@HiltViewModel
class OnboardingViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient,
    private val prefs: AppPreferences
) : ViewModel() {

    private val _state = MutableStateFlow(OnboardingUiState())
    val state = _state.asStateFlow()

    fun onNameChange(value: String) = _state.update { it.copy(name = value, error = null) }
    fun onIncomeChange(value: String) = _state.update { it.copy(income = value, error = null) }

    fun nextStep() {
        val current = _state.value
        when (current.step) {
            0 -> _state.update { it.copy(step = 1) }  // Welcome → Name
            1 -> {
                if (current.name.isBlank()) {
                    _state.update { it.copy(error = "Please enter your name") }
                    return
                }
                _state.update { it.copy(step = 2) }    // Name → Income
            }
            2 -> saveProfile()                         // Income → Save & Done
        }
    }

    private fun saveProfile() {
        val state = _state.value
        val income = state.income.toDoubleOrNull()
        if (income == null || income <= 0) {
            _state.update { it.copy(error = "Please enter a valid monthly income") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            try {
                val userId = supabaseClient.auth.currentUserOrNull()?.id
                    ?: throw Exception("Not authenticated")

                // Upsert profile — typed @Serializable class, not Map<String, Any>
                supabaseClient.postgrest["user_profiles"].upsert(
                    UserProfilePayload(
                        userId = userId,
                        fullName = state.name.trim(),
                        monthlyIncome = income
                    )
                )

                // Mark onboarding complete locally
                prefs.setOnboardingComplete()

                _state.update { it.copy(isLoading = false, isDone = true) }
            } catch (e: Exception) {
                _state.update {
                    it.copy(isLoading = false, error = e.message ?: "Failed to save profile")
                }
            }
        }
    }
}
