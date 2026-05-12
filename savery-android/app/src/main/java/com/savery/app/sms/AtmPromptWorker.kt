package com.savery.app.sms

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.savery.app.domain.model.Bucket
import com.savery.app.domain.model.Transaction
import com.savery.app.domain.model.TransactionSource
import com.savery.app.domain.repository.TransactionRepository  // ← correct package
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import java.time.LocalDate

/**
 * Delayed worker: fires the ATM prompt notification after a configurable delay.
 * Scheduled by SmsWorker via WorkManager when an ATM withdrawal is detected.
 */
@HiltWorker
class AtmPromptWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val notifier: SmartPromptNotifier
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_AMOUNT = "amount"
    }

    override suspend fun doWork(): Result {
        val amount = inputData.getDouble(KEY_AMOUNT, 0.0)
        if (amount > 0) notifier.showAtmPrompt(amount)
        return Result.success()
    }
}

/**
 * Handles one-tap category logging from the ATM notification action buttons.
 * Runs immediately when user taps a category in the notification.
 */
@HiltWorker
class QuickLogWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: TransactionRepository,  // ← domain.repository, injected by Hilt
    private val supabaseClient: SupabaseClient
) : CoroutineWorker(context, params) {

    companion object {
        const val KEY_AMOUNT = "amount"
        const val KEY_CATEGORY = "category"
    }

    override suspend fun doWork(): Result {
        val amount = inputData.getDouble(KEY_AMOUNT, 0.0)
        val category = inputData.getString(KEY_CATEGORY) ?: "Others"
        val userId = supabaseClient.auth.currentUserOrNull()?.id ?: return Result.failure()

        val transaction = Transaction(
            userId = userId,
            merchant = "ATM Cash",
            amount = amount,
            category = category,
            bucket = Bucket.DISCRETIONARY,
            date = LocalDate.now().toString(),
            source = TransactionSource.SMS,
            confidence = 0.8f,
            needsReview = false
        )
        repository.insertTransaction(transaction)
        return Result.success()
    }
}
