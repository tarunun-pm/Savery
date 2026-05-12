package com.savery.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val signInSuccess: Boolean = false,
    val signUpSuccess: Boolean = false   // New user → goes to Onboarding
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState = _uiState.asStateFlow()

    fun onEmailChange(value: String) = _uiState.update { it.copy(email = value, error = null) }
    fun onPasswordChange(value: String) = _uiState.update { it.copy(password = value, error = null) }

    fun signIn() {
        val state = _uiState.value
        if (!validate(state)) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                supabaseClient.auth.signInWith(Email) {
                    email = state.email.trim()
                    password = state.password
                }
                _uiState.update { it.copy(isLoading = false, signInSuccess = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = parseError(e.message)) }
            }
        }
    }

    fun signUp() {
        val state = _uiState.value
        if (!validate(state)) return
        if (state.password.length < 8) {
            _uiState.update { it.copy(error = "Password must be at least 8 characters") }
            return
        }
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                supabaseClient.auth.signUpWith(Email) {
                    email = state.email.trim()
                    password = state.password
                }
                _uiState.update { it.copy(isLoading = false, signUpSuccess = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = parseError(e.message)) }
            }
        }
    }

    private fun validate(state: AuthUiState): Boolean {
        if (state.email.isBlank() || state.password.isBlank()) {
            _uiState.update { it.copy(error = "Please enter email and password") }
            return false
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(state.email.trim()).matches()) {
            _uiState.update { it.copy(error = "Please enter a valid email address") }
            return false
        }
        return true
    }

    private fun parseError(message: String?): String = when {
        message == null -> "Something went wrong"
        message.contains("Invalid login") -> "Incorrect email or password"
        message.contains("already registered") -> "Account already exists. Please sign in."
        message.contains("rate limit") -> "Too many attempts. Please wait a moment."
        else -> message
    }
}
