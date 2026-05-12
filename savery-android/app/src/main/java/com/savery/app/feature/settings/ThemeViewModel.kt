package com.savery.app.feature.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.savery.app.core.preferences.AppPreferences
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ThemeViewModel @Inject constructor(
    private val prefs: AppPreferences
) : ViewModel() {

    val isDarkMode = prefs.isDarkMode
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    fun toggleTheme() {
        viewModelScope.launch {
            prefs.setDarkMode(!isDarkMode.value)
        }
    }
}
