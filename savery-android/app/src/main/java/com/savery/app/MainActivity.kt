package com.savery.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.*
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.savery.app.core.preferences.AppPreferences
import com.savery.app.feature.settings.ThemeViewModel
import com.savery.app.feature.startup.StartupDestination
import com.savery.app.feature.startup.StartupViewModel
import com.savery.app.ui.navigation.SaveryNavGraph
import com.savery.app.ui.theme.SaveryTheme
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val startupVm: StartupViewModel by viewModels()
    private val themeVm: ThemeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Show splash screen until startup routing resolves
        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition {
            startupVm.destination.value == StartupDestination.Loading
        }

        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            val isDark by themeVm.isDarkMode.collectAsState()
            val destination by startupVm.destination.collectAsState()

            SaveryTheme(darkTheme = isDark) {
                // Don't render nav until routing decision is made
                if (destination != StartupDestination.Loading) {
                    SaveryNavGraph(
                        startDestination = destination,
                        onToggleTheme = { themeVm.toggleTheme() },
                        onAuthSuccess = { isNew -> startupVm.onAuthSuccess(isNew) },
                        onOnboardingComplete = { startupVm.onOnboardingComplete() },
                        onSmsConsentResult = { granted -> startupVm.onSmsConsentResult(granted) }
                    )
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Re-check SMS permission every time app comes to foreground
        // Handles case: user granted/revoked permission in system settings
        startupVm.resolveDestination()
    }
}
