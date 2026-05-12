package com.savery.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.savery.app.ui.theme.LimePrimary

@Composable
fun AuthScreen(
    onSignInSuccess: () -> Unit,
    onSignUpSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    var isSignUp by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    // Reset visibility when switching tabs
    LaunchedEffect(isSignUp) { passwordVisible = false }

    LaunchedEffect(state.signInSuccess) { if (state.signInSuccess) onSignInSuccess() }
    LaunchedEffect(state.signUpSuccess) { if (state.signUpSuccess) onSignUpSuccess() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Logo
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text("🍋", fontSize = 56.sp)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Savery",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
                Text(
                    "Financial Clarity Engine",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Tab selector
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(modifier = Modifier.padding(4.dp)) {
                    listOf("Sign In" to false, "Create Account" to true).forEach { (label, isNew) ->
                        Surface(
                            modifier = Modifier.weight(1f),
                            color = if (isSignUp == isNew) MaterialTheme.colorScheme.surface
                                    else Color.Transparent,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            TextButton(
                                onClick = { isSignUp = isNew },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text(
                                    label,
                                    color = if (isSignUp == isNew) LimePrimary
                                            else MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = if (isSignUp == isNew) FontWeight.Bold
                                                 else FontWeight.Normal,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    }
                }
            }

            // Email field
            OutlinedTextField(
                value = state.email,
                onValueChange = { viewModel.onEmailChange(it) },
                label = { Text("Email address") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LimePrimary,
                    focusedLabelColor = LimePrimary,
                    cursorColor = LimePrimary
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            // Password field
            OutlinedTextField(
                value = state.password,
                onValueChange = { viewModel.onPasswordChange(it) },
                label = { Text(if (isSignUp) "Password (min. 8 chars)" else "Password") },
                modifier = Modifier.fillMaxWidth(),
                visualTransformation = if (passwordVisible) VisualTransformation.None
                                       else PasswordVisualTransformation(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                trailingIcon = {
                    IconButton(onClick = { passwordVisible = !passwordVisible }) {
                        Icon(
                            imageVector = if (passwordVisible) Icons.Default.VisibilityOff
                                          else Icons.Default.Visibility,
                            contentDescription = if (passwordVisible) "Hide password"
                                                 else "Show password",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LimePrimary,
                    focusedLabelColor = LimePrimary,
                    cursorColor = LimePrimary
                ),
                shape = RoundedCornerShape(14.dp),
                singleLine = true
            )

            // Error
            if (state.error != null) {
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        state.error!!,
                        color = MaterialTheme.colorScheme.onErrorContainer,
                        style = MaterialTheme.typography.bodySmall,
                        modifier = Modifier.padding(12.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            // Primary CTA
            Button(
                onClick = { if (isSignUp) viewModel.signUp() else viewModel.signIn() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = LimePrimary,
                    contentColor = Color.Black
                ),
                shape = RoundedCornerShape(28.dp),
                enabled = !state.isLoading
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        color = Color.Black,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text(
                        if (isSignUp) "Create Account" else "Sign In",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            if (!isSignUp) {
                TextButton(onClick = {}) {
                    Text(
                        "Forgot password?",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 13.sp
                    )
                }
            }
        }
    }
}
