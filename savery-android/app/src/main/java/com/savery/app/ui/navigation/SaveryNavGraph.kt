package com.savery.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.savery.app.feature.auth.AuthScreen
import com.savery.app.feature.chat.LemonChatScreen
import com.savery.app.feature.dashboard.HomeScreen
import com.savery.app.feature.goals.GoalsScreen
import com.savery.app.feature.insights.InsightsScreen
import com.savery.app.feature.onboarding.OnboardingScreen
import com.savery.app.feature.profile.ProfileScreen
import com.savery.app.feature.sms.SmsConsentScreen
import com.savery.app.feature.sms.TransactionReviewScreen
import com.savery.app.feature.spending.SpendingScreen
import com.savery.app.feature.startup.StartupDestination

sealed class Screen(val route: String) {
    object Auth              : Screen("auth")
    object Onboarding        : Screen("onboarding")
    object SmsConsent        : Screen("sms_consent")
    object Home              : Screen("home")
    object Spending          : Screen("spending")
    object Insights          : Screen("insights")
    object Goals             : Screen("goals")
    object Chat              : Screen("chat")
    object Profile           : Screen("profile")
    object TransactionReview : Screen("transaction_review")
}

fun StartupDestination.toRoute(): String = when (this) {
    StartupDestination.Auth       -> Screen.Auth.route
    StartupDestination.Onboarding -> Screen.Onboarding.route
    StartupDestination.SmsConsent -> Screen.SmsConsent.route
    else                          -> Screen.Home.route
}

@Composable
fun SaveryNavGraph(
    startDestination: StartupDestination,
    navController: NavHostController = rememberNavController(),
    onToggleTheme: () -> Unit,
    onAuthSuccess: (isNewUser: Boolean) -> Unit,
    onOnboardingComplete: () -> Unit,
    onSmsConsentResult: (Boolean) -> Unit
) {
    NavHost(
        navController = navController,
        startDestination = startDestination.toRoute()
    ) {

        // ── Auth ─────────────────────────────────────────────────────────────
        composable(Screen.Auth.route) {
            AuthScreen(
                onSignInSuccess = { onAuthSuccess(false) },
                onSignUpSuccess = { onAuthSuccess(true) }
            )
        }

        // ── Onboarding ───────────────────────────────────────────────────────
        composable(Screen.Onboarding.route) {
            OnboardingScreen(
                onComplete = {
                    onOnboardingComplete()
                    navController.navigate(Screen.SmsConsent.route) {
                        popUpTo(Screen.Onboarding.route) { inclusive = true }
                    }
                }
            )
        }

        // ── SMS Consent (shown every launch until granted) ───────────────────
        composable(Screen.SmsConsent.route) {
            SmsConsentScreen(
                onConsentGiven = {
                    onSmsConsentResult(true)
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.SmsConsent.route) { inclusive = true }
                    }
                },
                onSkip = {
                    // Skip for this session — will re-appear next launch
                    onSmsConsentResult(false)
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.SmsConsent.route) { inclusive = true }
                    }
                }
            )
        }

        // ── Main screens (with bottom nav) ───────────────────────────────────
        composable(Screen.Home.route) {
            MainScaffold(navController = navController, currentRoute = Screen.Home.route) {
                HomeScreen(
                    onNavigateToSpending = { navController.navigate(Screen.Spending.route) },
                    onNavigateToChat = { navController.navigate(Screen.Chat.route) },
                    onNavigateToProfile = { navController.navigate(Screen.Profile.route) }
                )
            }
        }

        composable(Screen.Spending.route) {
            MainScaffold(navController = navController, currentRoute = Screen.Spending.route) {
                SpendingScreen()
            }
        }

        composable(Screen.Insights.route) {
            MainScaffold(navController = navController, currentRoute = Screen.Insights.route) {
                InsightsScreen()
            }
        }

        composable(Screen.Goals.route) {
            MainScaffold(navController = navController, currentRoute = Screen.Goals.route) {
                GoalsScreen()
            }
        }

        // ── Full-screen overlays (no bottom nav) ─────────────────────────────
        composable(Screen.Chat.route) {
            LemonChatScreen(onBack = { navController.popBackStack() })
        }

        composable(Screen.Profile.route) {
            ProfileScreen(
                onBack = { navController.popBackStack() },
                onToggleTheme = onToggleTheme,
                onLogout = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.TransactionReview.route) {
            TransactionReviewScreen(onDone = { navController.popBackStack() })
        }
    }
}
