package com.savery.app.feature.dashboard

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.savery.app.ui.theme.LimePrimary
import kotlinx.coroutines.delay

private val CATEGORIES = listOf(
    "Food & Dining", "Transport", "Groceries", "Shopping", "Entertainment",
    "Health & Wellness", "Utilities", "Rent", "EMI", "Insurance",
    "Investment", "Education", "Personal Care", "Travel", "ATM Withdrawal",
    "Transfer", "Others"
)

private val BUCKETS = listOf("FIXED", "ESSENTIAL", "DISCRETIONARY")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToSpending: () -> Unit = {},
    onNavigateToChat: () -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var showLogSheet by remember { mutableStateOf(false) }

    if (showLogSheet) {
        ManualLogDialog(
            onDismiss = { showLogSheet = false },
            onSave = { merchant, amount, category, bucket ->
                viewModel.logTransaction(merchant, amount, category, bucket) {
                    showLogSheet = false
                }
            },
            viewModel = viewModel
        )
    }

    Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {

        // Main scroll content
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 100.dp)  // space for FAB
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // ── Header ────────────────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        getGreeting(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        if (state.userName.isNotBlank()) state.userName else "…",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    IconButton(
                        onClick = onNavigateToProfile,
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = "Profile",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }

            // ── Error banner ──────────────────────────────────────────────────
            if (state.error != null) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Failed to load dashboard data",
                                fontWeight = FontWeight.SemiBold,
                                color = MaterialTheme.colorScheme.onErrorContainer,
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                state.error!!,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                        IconButton(onClick = { viewModel.refresh() }) {
                            Icon(
                                Icons.Default.Refresh,
                                contentDescription = "Retry",
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }

            // ── Loading state ─────────────────────────────────────────────────
            if (state.isLoading) {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = LimePrimary)
                }
            }

            // ── Safe-to-Spend Card (hero) ─────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(modifier = Modifier.padding(28.dp)) {
                    Text(
                        "SAFE TO SPEND TODAY",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        "₹${state.safeToSpend.toLong()}",
                        fontSize = 44.sp,
                        fontWeight = FontWeight.Bold,
                        color = LimePrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (state.monthlyIncome > 0) {
                        LinearProgressIndicator(
                            progress = { (state.totalSpent / state.monthlyIncome).coerceIn(0.0, 1.0).toFloat() },
                            modifier = Modifier.fillMaxWidth().height(6.dp),
                            color = LimePrimary,
                            trackColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Text(
                        "Spent ₹${state.totalSpent.toLong()} of ₹${state.monthlyIncome.toLong()} this month",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // ── Spend buckets ────────────────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        "This Month",
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        BucketChip("Fixed", state.fixedTotal)
                        BucketChip("Essential", state.essentialTotal)
                        BucketChip("Flexible", state.discretionaryTotal)
                    }
                }
            }

            // ── Quick Actions ─────────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickActionCard(
                    emoji = "💸",
                    label = "Log Cash",
                    modifier = Modifier.weight(1f),
                    onClick = { showLogSheet = true }   // Opens manual log sheet with AI categorizer
                )
                QuickActionCard(
                    emoji = "🤔",
                    label = "Can I Spend?",
                    modifier = Modifier.weight(1f),
                    onClick = onNavigateToChat
                )
            }

            // ── SMS auto-tracked badge ────────────────────────────────────────
            if (state.autoTrackedCount > 0) {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text("⚡", fontSize = 20.sp)
                        Column {
                            Text(
                                "Auto-tracked ${state.autoTrackedCount} transactions",
                                fontWeight = FontWeight.SemiBold,
                                color = LimePrimary,
                                style = MaterialTheme.typography.bodySmall
                            )
                            Text(
                                "Savery read your bank messages automatically",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // ── Lemon Chat FAB ────────────────────────────────────────────────────
        FloatingActionButton(
            onClick = onNavigateToChat,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 24.dp, bottom = 88.dp),  // above bottom nav
            containerColor = LimePrimary,
            contentColor = Color.Black,
            shape = CircleShape
        ) {
            Text("🍋", fontSize = 24.sp)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ManualLogDialog(
    onDismiss: () -> Unit,
    onSave: (merchant: String, amount: Double, category: String, bucket: String) -> Unit,
    viewModel: HomeViewModel
) {
    var amountText by remember { mutableStateOf("") }
    var merchantText by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("Others") }
    var selectedBucket by remember { mutableStateOf("DISCRETIONARY") }

    val suggestedCategory by viewModel.suggestedCategory.collectAsState()
    val suggestedBucket by viewModel.suggestedBucket.collectAsState()

    var catExpanded by remember { mutableStateOf(false) }
    var bucketExpanded by remember { mutableStateOf(false) }

    // AI Categorizer Trigger when merchant name changes (debounced 600ms)
    LaunchedEffect(merchantText) {
        if (merchantText.isNotBlank()) {
            delay(600)
            viewModel.suggestCategoryAndBucket(merchantText.trim())
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Log Cash Expense",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = MaterialTheme.colorScheme.onBackground
                )

                // Amount Field
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Amount (₹)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = LimePrimary,
                        focusedLabelColor = LimePrimary,
                        cursorColor = LimePrimary
                    )
                )

                // Merchant / Payee Field
                OutlinedTextField(
                    value = merchantText,
                    onValueChange = { merchantText = it },
                    label = { Text("Where did you spend?") },
                    placeholder = { Text("e.g., Chai Point, Auto, Swiggy") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = LimePrimary,
                        focusedLabelColor = LimePrimary,
                        cursorColor = LimePrimary
                    )
                )

                // AI Categorizer Suggestion Panel
                if (suggestedCategory != null) {
                    Surface(
                        color = LimePrimary.copy(alpha = 0.12f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    "✨ AI Suggestion",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = LimePrimary
                                )
                                Text(
                                    "Category: $suggestedCategory (${suggestedBucket?.lowercase()})",
                                    fontSize = 13.sp,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                            Button(
                                onClick = {
                                    selectedCategory = suggestedCategory ?: "Others"
                                    selectedBucket = suggestedBucket ?: "DISCRETIONARY"
                                },
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = LimePrimary,
                                    contentColor = Color.Black
                                ),
                                shape = RoundedCornerShape(8.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text("Apply", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Category Selection Box
                Box {
                    OutlinedTextField(
                        value = selectedCategory,
                        onValueChange = {},
                        label = { Text("Category") },
                        readOnly = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        trailingIcon = {
                            IconButton(onClick = { catExpanded = true }) {
                                Icon(Icons.Default.ArrowDropDown, "Open dropdown")
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LimePrimary,
                            focusedLabelColor = LimePrimary
                        )
                    )
                    DropdownMenu(
                        expanded = catExpanded,
                        onDismissRequest = { catExpanded = false },
                        modifier = Modifier.fillMaxWidth(0.8f)
                    ) {
                        CATEGORIES.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category) },
                                onClick = {
                                    selectedCategory = category
                                    catExpanded = false
                                }
                            )
                        }
                    }
                }

                // Budget Bucket Selection Box
                Box {
                    OutlinedTextField(
                        value = selectedBucket.lowercase().replaceFirstChar { it.uppercase() },
                        onValueChange = {},
                        label = { Text("Budget Bucket") },
                        readOnly = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        trailingIcon = {
                            IconButton(onClick = { bucketExpanded = true }) {
                                Icon(Icons.Default.ArrowDropDown, "Open dropdown")
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = LimePrimary,
                            focusedLabelColor = LimePrimary
                        )
                    )
                    DropdownMenu(
                        expanded = bucketExpanded,
                        onDismissRequest = { bucketExpanded = false }
                    ) {
                        BUCKETS.forEach { bucket ->
                            DropdownMenuItem(
                                text = { Text(bucket.lowercase().replaceFirstChar { it.uppercase() }) },
                                onClick = {
                                    selectedBucket = bucket
                                    bucketExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Actions Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }

                    val amount = amountText.toDoubleOrNull() ?: 0.0
                    val isEnabled = amount > 0 && merchantText.isNotBlank()

                    Button(
                        onClick = {
                            onSave(merchantText.trim(), amount, selectedCategory, selectedBucket)
                        },
                        modifier = Modifier.weight(1.2f),
                        enabled = isEnabled,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = LimePrimary,
                            contentColor = Color.Black
                        )
                    ) {
                        Text("Save Log", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun BucketChip(label: String, amount: Double) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            "₹${amount.toLong()}",
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
            style = MaterialTheme.typography.bodyLarge
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun QuickActionCard(
    emoji: String,
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(emoji, fontSize = 28.sp)
            Text(
                label,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }
    }
}

private fun getGreeting(): String {
    val hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)
    return when {
        hour < 12 -> "Good morning,"
        hour < 17 -> "Good afternoon,"
        else      -> "Good evening,"
    }
}
