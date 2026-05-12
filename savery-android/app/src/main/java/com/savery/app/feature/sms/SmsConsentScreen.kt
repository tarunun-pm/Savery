package com.savery.app.feature.sms

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.savery.app.ui.theme.LimePrimary

/**
 * Privacy-first consent screen for SMS reading permission.
 * Shown once after the user's first login.
 * Design: clean, transparent, non-alarming.
 */
@Composable
fun SmsConsentScreen(
    onConsentGiven: () -> Unit,
    onSkip: () -> Unit
) {
    val context = LocalContext.current
    var permissionGranted by remember { mutableStateOf(false) }
    var showRationale by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.RECEIVE_SMS] == true &&
                permissions[Manifest.permission.READ_SMS] == true
        if (granted) {
            permissionGranted = true
            onConsentGiven()
        } else {
            showRationale = true
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(28.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Lemon icon / lock icon at top
            Box(
                modifier = Modifier
                    .size(96.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentAlignment = Alignment.Center
            ) {
                Text("🔒", fontSize = 44.sp)
            }

            // Headline
            Text(
                text = "Auto-track your spending",
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center
            )

            // Explanation
            Text(
                text = buildAnnotatedString {
                    append("Savery reads your bank messages to track spending ")
                    withStyle(SpanStyle(fontWeight = FontWeight.Bold, color = LimePrimary)) {
                        append("automatically")
                    }
                    append(" — so you never have to log a transaction manually.")
                },
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                lineHeight = 24.sp
            )

            // Privacy points
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                PrivacyPoint(
                    icon = "📱",
                    title = "Stays on your device",
                    desc = "Your messages are processed locally. Only spending data (amount, merchant) is saved."
                )
                PrivacyPoint(
                    icon = "🚫",
                    title = "No raw SMS stored",
                    desc = "The message text itself is never sent to any server."
                )
                PrivacyPoint(
                    icon = "✏️",
                    title = "You're always in control",
                    desc = "Review and edit every auto-captured transaction before it's confirmed."
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Primary CTA
            Button(
                onClick = {
                    permissionLauncher.launch(
                        arrayOf(
                            Manifest.permission.RECEIVE_SMS,
                            Manifest.permission.READ_SMS
                        )
                    )
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LimePrimary,
                    contentColor = Color.Black
                ),
                shape = RoundedCornerShape(28.dp)
            ) {
                Text(
                    "Enable Auto-Tracking",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            // Skip
            TextButton(onClick = onSkip) {
                Text(
                    "I'll log manually",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 14.sp
                )
            }
        }
    }
}

@Composable
private fun PrivacyPoint(icon: String, title: String, desc: String) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.Top
    ) {
        Text(icon, fontSize = 20.sp)
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
            Text(
                text = desc,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 18.sp
            )
        }
    }
}
