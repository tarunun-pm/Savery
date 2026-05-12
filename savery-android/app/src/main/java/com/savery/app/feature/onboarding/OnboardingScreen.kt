package com.savery.app.feature.onboarding

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.savery.app.ui.theme.LimePrimary

@Composable
fun OnboardingScreen(
    onComplete: () -> Unit,
    viewModel: OnboardingViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state.isDone) {
        if (state.isDone) onComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Step progress indicator dots at top
        if (state.step > 0) {
            Row(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 64.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                repeat(2) { index ->
                    Surface(
                        modifier = Modifier.size(
                            width = if (state.step - 1 == index) 28.dp else 8.dp,
                            height = 8.dp
                        ),
                        shape = RoundedCornerShape(4.dp),
                        color = if (state.step - 1 >= index) LimePrimary
                                else MaterialTheme.colorScheme.outline
                    ) {}
                }
            }
        }

        // Animated content between steps
        AnimatedContent(
            targetState = state.step,
            transitionSpec = {
                slideInHorizontally(initialOffsetX = { it }) + fadeIn() togetherWith
                    slideOutHorizontally(targetOffsetX = { -it }) + fadeOut()
            },
            modifier = Modifier.fillMaxSize()
        ) { step ->
            when (step) {
                0 -> WelcomeStep(onNext = { viewModel.nextStep() })
                1 -> NameStep(
                    name = state.name,
                    error = state.error,
                    onNameChange = viewModel::onNameChange,
                    onNext = { viewModel.nextStep() }
                )
                2 -> IncomeStep(
                    income = state.income,
                    error = state.error,
                    isLoading = state.isLoading,
                    onIncomeChange = viewModel::onIncomeChange,
                    onDone = { viewModel.nextStep() }
                )
            }
        }
    }
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────

@Composable
private fun WelcomeStep(onNext: () -> Unit) {
    // Animate lemon scale on entry
    val scale by animateFloatAsState(
        targetValue = 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy),
        label = "lemon_scale"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Lemon icon with bounce
        var triggered by remember { mutableStateOf(false) }
        val lemonScale by animateFloatAsState(
            targetValue = if (triggered) 1f else 0.3f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessLow
            ),
            label = "lemon_entry"
        )
        LaunchedEffect(Unit) { triggered = true }

        Text(
            "🍋",
            fontSize = 80.sp,
            modifier = Modifier.scale(lemonScale)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Text(
            "Meet Lemon",
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            "Your AI-powered financial co-pilot.\nLemon reads your bank messages and\ntells you exactly where your money goes.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 26.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Feature pills
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            FeaturePill("⚡", "Auto-captures bank transactions")
            FeaturePill("🧠", "AI categorizes your spending")
            FeaturePill("💬", "Chat with Lemon anytime")
        }

        Spacer(modifier = Modifier.height(48.dp))

        Button(
            onClick = onNext,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = LimePrimary,
                contentColor = Color.Black
            ),
            shape = RoundedCornerShape(28.dp)
        ) {
            Text("Let's get started", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
private fun FeaturePill(icon: String, text: String) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Text(icon, fontSize = 18.sp)
            Text(
                text,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}

// ── Step 2: Name ─────────────────────────────────────────────────────────────

@Composable
private fun NameStep(
    name: String,
    error: String?,
    onNameChange: (String) -> Unit,
    onNext: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("👤", fontSize = 56.sp)
        Spacer(modifier = Modifier.height(24.dp))

        Text(
            "What should Lemon call you?",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "Your name appears on your dashboard\nand in Lemon's messages.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(40.dp))

        OutlinedTextField(
            value = name,
            onValueChange = onNameChange,
            label = { Text("First name") },
            placeholder = { Text("e.g. Tarun") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                imeAction = ImeAction.Next
            ),
            keyboardActions = KeyboardActions(onNext = { focusManager.clearFocus(); onNext() }),
            isError = error != null,
            supportingText = { if (error != null) Text(error, color = MaterialTheme.colorScheme.error) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = LimePrimary,
                focusedLabelColor = LimePrimary,
                cursorColor = LimePrimary
            ),
            shape = RoundedCornerShape(14.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onNext,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = name.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = LimePrimary,
                contentColor = Color.Black,
                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            shape = RoundedCornerShape(28.dp)
        ) {
            Text("Continue", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

// ── Step 3: Income ───────────────────────────────────────────────────────────

@Composable
private fun IncomeStep(
    income: String,
    error: String?,
    isLoading: Boolean,
    onIncomeChange: (String) -> Unit,
    onDone: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("💰", fontSize = 56.sp)
        Spacer(modifier = Modifier.height(24.dp))

        Text(
            "What's your monthly income?",
            fontSize = 26.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "Lemon uses this to calculate\nhow much is safe to spend each day.",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            lineHeight = 24.sp
        )

        Spacer(modifier = Modifier.height(40.dp))

        OutlinedTextField(
            value = income,
            onValueChange = { if (it.all { c -> c.isDigit() }) onIncomeChange(it) },
            label = { Text("Monthly income") },
            placeholder = { Text("e.g. 80000") },
            prefix = { Text("₹", color = LimePrimary, fontWeight = FontWeight.Bold) },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Number,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(onDone = { focusManager.clearFocus(); onDone() }),
            isError = error != null,
            supportingText = {
                if (error != null) Text(error, color = MaterialTheme.colorScheme.error)
                else Text("This stays on your device and is never shared.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = LimePrimary,
                focusedLabelColor = LimePrimary,
                cursorColor = LimePrimary
            ),
            shape = RoundedCornerShape(14.dp)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onDone,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            enabled = income.isNotBlank() && !isLoading,
            colors = ButtonDefaults.buttonColors(
                containerColor = LimePrimary,
                contentColor = Color.Black,
                disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant
            ),
            shape = RoundedCornerShape(28.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.Black, strokeWidth = 2.dp)
            } else {
                Text("Take me to Savery →", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            }
        }
    }
}
