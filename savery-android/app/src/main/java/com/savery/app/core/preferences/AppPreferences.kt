package com.savery.app.core.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.appDataStore: DataStore<Preferences>
        by preferencesDataStore(name = "savery_app_prefs")

/**
 * Single source of truth for all persistent app-level flags.
 * Keeps onboarding state, SMS consent, and theme preference.
 */
@Singleton
class AppPreferences @Inject constructor(
    @ApplicationContext private val context: Context
) {
    companion object {
        val ONBOARDING_COMPLETE  = booleanPreferencesKey("onboarding_complete")
        val SMS_PERMISSION_GRANTED = booleanPreferencesKey("sms_permission_granted")
        val DARK_MODE            = booleanPreferencesKey("dark_mode")
    }

    // ── Onboarding ────────────────────────────────────────────────────────────

    val isOnboardingComplete: Flow<Boolean> = context.appDataStore.data
        .map { it[ONBOARDING_COMPLETE] ?: false }

    suspend fun setOnboardingComplete() {
        context.appDataStore.edit { it[ONBOARDING_COMPLETE] = true }
    }

    // ── SMS Consent ───────────────────────────────────────────────────────────

    /**
     * True only when the OS permission has actually been granted.
     * Reset to false if the user revokes it in system settings.
     */
    val isSmsPermissionGranted: Flow<Boolean> = context.appDataStore.data
        .map { it[SMS_PERMISSION_GRANTED] ?: false }

    suspend fun setSmsPermissionGranted(granted: Boolean) {
        context.appDataStore.edit { it[SMS_PERMISSION_GRANTED] = granted }
    }

    // ── Theme ─────────────────────────────────────────────────────────────────

    val isDarkMode: Flow<Boolean> = context.appDataStore.data
        .map { it[DARK_MODE] ?: true }  // Default: dark

    suspend fun setDarkMode(dark: Boolean) {
        context.appDataStore.edit { it[DARK_MODE] = dark }
    }
}
