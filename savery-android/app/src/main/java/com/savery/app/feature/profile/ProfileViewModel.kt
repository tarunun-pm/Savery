package com.savery.app.feature.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import javax.inject.Inject

data class ProfileUiState(
    val name: String = "",
    val email: String = "",
    val income: Double = 0.0,
    val isDarkMode: Boolean = true
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            try {
                val user = supabaseClient.auth.currentUserOrNull() ?: return@launch
                val profile = supabaseClient.postgrest["user_profiles"].select { filter { eq("user_id", user.id) } }.decodeSingle<Map<String, kotlinx.serialization.json.JsonElement>>()
                _uiState.update { it.copy(
                    name = profile["full_name"]?.jsonPrimitive?.content ?: "",
                    email = user.email ?: "",
                    income = profile["monthly_income"]?.jsonPrimitive?.doubleOrNull ?: 0.0
                )}
            } catch (_: Exception) {}
        }
    }

    fun logout(onComplete: () -> Unit) {
        viewModelScope.launch {
            supabaseClient.auth.signOut()
            onComplete()
        }
    }
}
