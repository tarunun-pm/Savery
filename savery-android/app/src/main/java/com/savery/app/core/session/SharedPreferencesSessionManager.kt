package com.savery.app.core.session

import android.content.Context
import android.util.Log
import io.github.jan.supabase.auth.SessionManager
import io.github.jan.supabase.auth.user.UserSession
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Persists the Supabase auth session to SharedPreferences.
 *
 * Why SharedPreferences (not DataStore)?
 * - SessionManager callbacks are called from Supabase's internal coroutines.
 * - SharedPreferences with commit() is synchronous and safe from any thread.
 * - DataStore requires a specific coroutine scope and complicates the Hilt wiring.
 *
 * Security: The session tokens are stored in app-private SharedPreferences
 * (MODE_PRIVATE). On Android 7+, these are encrypted at the file system level
 * via the device's full-disk or file-based encryption.
 */
class SharedPreferencesSessionManager(private val context: Context) : SessionManager {

    companion object {
        private const val PREFS_NAME = "supabase_session"
        private const val KEY_SESSION = "session_json"
        private const val TAG = "SessionManager"
    }

    private val prefs by lazy {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val json = Json { ignoreUnknownKeys = true }

    override suspend fun loadSession(): UserSession? {
        val raw = prefs.getString(KEY_SESSION, null) ?: run {
            Log.d(TAG, "No persisted session found")
            return null
        }
        return try {
            val session = json.decodeFromString<UserSession>(raw)
            Log.d(TAG, "Session loaded from SharedPreferences (expires ${session.expiresAt})")
            session
        } catch (e: Exception) {
            Log.w(TAG, "Failed to deserialize session — clearing: ${e.message}")
            deleteSession()
            null
        }
    }

    override suspend fun saveSession(userSession: UserSession) {
        try {
            val raw = json.encodeToString(userSession)
            prefs.edit().putString(KEY_SESSION, raw).commit()
            Log.d(TAG, "Session saved to SharedPreferences")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save session: ${e.message}")
        }
    }

    override suspend fun deleteSession() {
        prefs.edit().remove(KEY_SESSION).commit()
        Log.d(TAG, "Session deleted from SharedPreferences")
    }
}
