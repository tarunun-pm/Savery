package com.savery.app.feature.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.savery.app.ui.theme.LimePrimary

@Composable
fun LemonChatScreen(
    onBack: () -> Unit,
    viewModel: LemonChatViewModel = hiltViewModel()
) {
    val state by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    var inputText by remember { mutableStateOf("") }

    LaunchedEffect(state.messages.size) {
        if (state.messages.isNotEmpty()) listState.animateScrollToItem(state.messages.size - 1)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
            }
            Text("🍋", fontSize = 28.sp)
            Column {
                Text("Lemon", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onBackground)
                Text("Your AI financial guide", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }

        // Messages
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(state.messages) { msg ->
                ChatBubble(msg)
            }
            if (state.isTyping) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.padding(start = 8.dp)) {
                        repeat(3) {
                            Surface(shape = RoundedCornerShape(50), color = MaterialTheme.colorScheme.outline, modifier = Modifier.size(8.dp)) {}
                        }
                    }
                }
            }
        }

        // Input bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("Ask Lemon anything...", color = MaterialTheme.colorScheme.onSurfaceVariant) },
                modifier = Modifier.weight(1f),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = LimePrimary,
                    cursorColor = LimePrimary
                ),
                shape = RoundedCornerShape(24.dp),
                maxLines = 3
            )
            IconButton(
                onClick = {
                    if (inputText.isNotBlank()) {
                        viewModel.sendMessage(inputText.trim())
                        inputText = ""
                    }
                },
                modifier = Modifier
                    .size(48.dp)
                    .background(LimePrimary, RoundedCornerShape(50))
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send", tint = Color.Black)
            }
        }
    }
}

@Composable
private fun ChatBubble(msg: ChatMessage) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (msg.isUser) Arrangement.End else Arrangement.Start
    ) {
        if (!msg.isUser) Text("🍋", fontSize = 20.sp, modifier = Modifier.padding(end = 6.dp, top = 4.dp))
        Surface(
            color = if (msg.isUser) LimePrimary else MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(
                topStart = 20.dp, topEnd = 20.dp,
                bottomStart = if (msg.isUser) 20.dp else 4.dp,
                bottomEnd = if (msg.isUser) 4.dp else 20.dp
            )
        ) {
            Text(
                msg.text,
                modifier = Modifier.padding(12.dp, 10.dp),
                color = if (msg.isUser) Color.Black else MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.bodyLarge,
                lineHeight = 22.sp
            )
        }
    }
}
