package com.savery.app.feature.startup

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.savery.app.core.preferences.AppPreferences
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "StartupViewModel"

/**
 * Routing destination determined at startup.
 */
sealed class StartupDestination {
    object Loading     : StartupDestination()  // Checking state — show splash
    object Auth        : StartupDestination()  // Not logged in
    object Onboarding  : StartupDestination()  // Logged in, first time
    object SmsConsent  : StartupDestination()  // Logged in + onboarding done, no SMS permission
    object Home        : StartupDestination()  // Fully set up
}

/**
 * Determines where to send the user on every app launch.
 * This is the single decision-maker for the entire navigation entry point.
 *
 * Logic:
 * 1. Not logged in → Auth
 * 2. Logged in + onboarding not complete → Onboarding
 * 3. Logged in + onboarding done + SMS NOT granted → SmsConsent (every launch)
 * 4. Logged in + onboarding done + SMS granted → Home
 */
@HiltViewModel
class StartupViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val supabaseClient: SupabaseClient,
    private val prefs: AppPreferences
) : ViewModel() {

    private val _destination = MutableStateFlow<StartupDestination>(StartupDestination.Loading)
    val destination: StateFlow<StartupDestination> = _destination.asStateFlow()

    init {
        resolveDestination()
    }

    fun resolveDestination() {
        viewModelScope.launch {
            _destination.value = StartupDestination.Loading

            // ─── CRITICAL: wait for Auth to finish loading the persisted session ───
            // The Auth plugin loads the session from SharedPreferences asynchronously.
            // Without awaitInitialization(), currentSessionOrNull() races against
            // that load and returns null — forcing re-login every cold start.
            try {
                supabaseClient.auth.awaitInitialization()
                Log.d(TAG, "Auth initialized")
            } catch (e: Exception) {
                Log.w(TAG, "Auth init warning: ${e.message}")
                // Non-fatal — continue and check session anyway
            }

            // Step 1: Check auth
            val session = supabaseClient.auth.currentSessionOrNull()
            Log.d(TAG, "Session: ${if (session != null) "VALID (uid=${session.user?.id?.take(8)}…)" else "NULL"}")

            if (session == null) {
                Log.d(TAG, "→ Auth screen")
                _destination.value = StartupDestination.Auth
                return@launch
            }

            // Step 2: Check onboarding
            val onboardingDone = prefs.isOnboardingComplete.first()
            Log.d(TAG, "onboardingDone=$onboardingDone")
            if (!onboardingDone) {
                Log.d(TAG, "→ Onboarding")
                _destination.value = StartupDestination.Onboarding
                return@launch
            }

            // Step 3: Check SMS permission
            val smsGranted = hasSmsPermission()
            prefs.setSmsPermissionGranted(smsGranted)
            Log.d(TAG, "smsGranted=$smsGranted → ${if (smsGranted) "Home" else "SmsConsent"}")

            _destination.value = if (smsGranted) {
                StartupDestination.Home
            } else {
                StartupDestination.SmsConsent
            }
        }
    }

    /**
     * Called after auth succeeds — re-evaluates destination.
     * New users (no existing profile) go to Onboarding.
     * Returning users go straight to SMS check.
     */
    fun onAuthSuccess(isNewUser: Boolean) {
        viewModelScope.launch {
            if (isNewUser) {
                _destination.value = StartupDestination.Onboarding
            } else {
                // Returning user: check onboarding flag (they might have been
                // interrupted mid-onboarding on a previous session)
                val onboardingDone = prefs.isOnboardingComplete.first()
                if (!onboardingDone) {
                    _destination.value = StartupDestination.Onboarding
                } else {
                    val smsGranted = hasSmsPermission()
                    prefs.setSmsPermissionGranted(smsGranted)
                    _destination.value = if (smsGranted) StartupDestination.Home
                                         else StartupDestination.SmsConsent
                }
            }
        }
    }

    fun onOnboardingComplete() {
        viewModelScope.launch {
            val smsGranted = hasSmsPermission()
            _destination.value = if (smsGranted) StartupDestination.Home
                                  else StartupDestination.SmsConsent
        }
    }

    fun onSmsConsentResult(granted: Boolean) {
        viewModelScope.launch {
            prefs.setSmsPermissionGranted(granted)
            _destination.value = StartupDestination.Home
        }
    }

    private fun hasSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context, Manifest.permission.RECEIVE_SMS
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            context, Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }
}
