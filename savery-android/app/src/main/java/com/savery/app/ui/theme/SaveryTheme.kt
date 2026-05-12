package com.savery.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// ── Brand Colors ─────────────────────────────────────────────────────────────
val LimePrimary    = Color(0xFFC8F100)   // Signature lime
val LimeDeep       = Color(0xFF8FB800)   // Accessible lime for light mode
val LimeDark       = Color(0xFF6E8F00)

// ── Dark Theme Palette ────────────────────────────────────────────────────────
private val DarkColorScheme = darkColorScheme(
    primary          = LimePrimary,
    onPrimary        = Color(0xFF000000),
    primaryContainer = Color(0xFF1A2400),
    background       = Color(0xFF0A0A0A),
    surface          = Color(0xFF111111),
    surfaceVariant   = Color(0xFF1A1A1A),
    onBackground     = Color(0xFFFFFFFF),
    onSurface        = Color(0xFFFFFFFF),
    onSurfaceVariant = Color(0xFF888888),
    outline          = Color(0xFF2A2A2A),
    error            = Color(0xFFFF5C5C),
)

// ── Light Theme Palette ───────────────────────────────────────────────────────
private val LightColorScheme = lightColorScheme(
    primary          = LimeDeep,
    onPrimary        = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFF0FAD0),
    background       = Color(0xFFF5F5F5),
    surface          = Color(0xFFFFFFFF),
    surfaceVariant   = Color(0xFFF0F0F0),
    onBackground     = Color(0xFF111111),
    onSurface        = Color(0xFF111111),
    onSurfaceVariant = Color(0xFF666666),
    outline          = Color(0xFFDDDDDD),
    error            = Color(0xFFD32F2F),
)

// ── Typography ────────────────────────────────────────────────────────────────
// Acumin Pro shipped as system sans-serif fallback.
// For production: bundle TTF in assets/ and load via FontFamily(Font(...))

val AcuminFontFamily = FontFamily.SansSerif

val SaveryTypography = Typography(
    displayLarge = TextStyle(
        fontFamily = AcuminFontFamily,
        fontSize = 44.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-0.02).sp
    ),
    titleLarge = TextStyle(
        fontFamily = AcuminFontFamily,
        fontSize = 26.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-0.01).sp
    ),
    bodyLarge = TextStyle(
        fontFamily = AcuminFontFamily,
        fontSize = 15.sp,
        fontWeight = FontWeight.Normal
    ),
    bodySmall = TextStyle(
        fontFamily = AcuminFontFamily,
        fontSize = 13.sp,
        fontWeight = FontWeight.Normal
    ),
    labelSmall = TextStyle(
        fontFamily = AcuminFontFamily,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        letterSpacing = 0.5.sp
    )
)

// ── Theme Composable ──────────────────────────────────────────────────────────
@Composable
fun SaveryTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = SaveryTypography,
        content = content
    )
}
