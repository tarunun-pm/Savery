package com.savery.app.core.di

import android.content.Context
import com.savery.app.BuildConfig
import com.savery.app.core.session.SharedPreferencesSessionManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(
        @ApplicationContext context: Context
    ): SupabaseClient {
        // Persistent session manager — survives app restarts and process kills
        val sessionManager = SharedPreferencesSessionManager(context)

        return createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth) {
                // Wire in persistent session storage
                // Without this, Auth defaults to in-memory → user re-logs on every launch
                this.sessionManager = sessionManager
            }
            install(Postgrest)
            install(Realtime)
        }
    }
}
