package com.savery.app.core.di

import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.generationConfig
import com.savery.app.BuildConfig
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Named
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object GeminiModule {

    @Provides
    @Singleton
    @Named("categorizer")
    fun provideCategorizerModel(): GenerativeModel {
        return GenerativeModel(
            modelName = "gemini-2.0-flash",
            apiKey = BuildConfig.GEMINI_API_KEY,
            generationConfig = generationConfig {
                temperature = 0.1f     // Low temperature for consistent categorization
                maxOutputTokens = 256  // Short responses for category JSON
            },
            systemInstruction = com.google.ai.client.generativeai.type.content("system") {
                text("""
                    You are a financial transaction categorizer for Indian users.
                    Given a merchant name or SMS text, return ONLY valid JSON (no markdown) in this exact format:
                    {"category":"Food & Dining","subcategory":"Food Delivery","bucket":"discretionary","confidence":0.95}
                    
                    Buckets must be one of: "fixed", "essential", "discretionary"
                    Categories: Food & Dining, Transport, Groceries, Shopping, Entertainment, 
                    Health & Wellness, Utilities, Rent, EMI, Insurance, Investment, Education, 
                    Personal Care, Travel, ATM Withdrawal, Transfer, Others
                """.trimIndent())
            }
        )
    }

    @Provides
    @Singleton
    @Named("chat")
    fun provideChatModel(): GenerativeModel {
        return GenerativeModel(
            modelName = "gemini-2.0-flash",
            apiKey = BuildConfig.GEMINI_API_KEY,
            generationConfig = generationConfig {
                temperature = 0.7f
                maxOutputTokens = 1024
            }
        )
    }
}
