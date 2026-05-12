package com.savery.app.sms

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import com.savery.app.MainActivity
import com.savery.app.R
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Schedules and displays actionable smart prompt notifications.
 *
 * ATM Prompt: "You withdrew ₹5,000. Where did it go?"
 * - Shown 1 hour after withdrawal
 * - Action buttons for top categories (Groceries, Transport, etc.)
 *
 * Weekly Sweep: "3 transactions need your review"
 * - Shown Sunday evenings
 */
@Singleton
class SmartPromptNotifier @Inject constructor(
    @ApplicationContext private val context: Context
) {

    companion object {
        const val CHANNEL_ATM = "savery_atm_prompt"
        const val CHANNEL_WEEKLY = "savery_weekly_sweep"
        const val CHANNEL_GENERAL = "savery_general"
    }

    init {
        createNotificationChannels()
    }

    /**
     * Schedules an ATM prompt notification after [delayMinutes].
     * Uses WorkManager so it survives app closure.
     */
    fun scheduleAtmPrompt(amount: Double, delayMinutes: Long = 60) {
        val work = OneTimeWorkRequestBuilder<AtmPromptWorker>()
            .setInitialDelay(delayMinutes, TimeUnit.MINUTES)
            .setInputData(workDataOf(AtmPromptWorker.KEY_AMOUNT to amount))
            .build()

        WorkManager.getInstance(context).enqueue(work)
    }

    /**
     * Shows an immediate ATM prompt notification.
     * Called by AtmPromptWorker after the delay.
     */
    fun showAtmPrompt(amount: Double) {
        val formattedAmount = "₹${amount.toLong()}"
        val notificationId = System.currentTimeMillis().toInt()

        // Deep-link intent to open the Log Cash screen pre-filled with amount
        val openIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "log_cash")
            putExtra("amount", amount)
        }
        val openPendingIntent = PendingIntent.getActivity(
            context, notificationId, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Quick-action category intents (one-tap logging)
        val categories = listOf("Groceries", "Transport", "Food & Dining", "Others")
        val actions = categories.map { category ->
            val actionIntent = Intent(context, SmsQuickLogReceiver::class.java).apply {
                putExtra("amount", amount)
                putExtra("category", category)
                putExtra("notification_id", notificationId)
            }
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                (notificationId + category.hashCode()),
                actionIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            NotificationCompat.Action.Builder(0, category, pendingIntent).build()
        }

        val notification = NotificationCompat.Builder(context, CHANNEL_ATM)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Where did $formattedAmount go?")
            .setContentText("You withdrew $formattedAmount. Tap to log how it was spent.")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("You withdrew $formattedAmount from the ATM. Savery didn't see it spent anywhere. Where did it go?"))
            .setContentIntent(openPendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .apply { actions.take(3).forEach { addAction(it) } }
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(notificationId, notification)
    }

    /**
     * Shows a weekly review notification for unclassified transactions.
     */
    fun showWeeklySweep(unclassifiedCount: Int, totalAutoTracked: Double) {
        if (unclassifiedCount == 0) return

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("action", "review_transactions")
        }
        val pendingIntent = PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_WEEKLY)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Your week in review")
            .setContentText("I auto-tracked ₹${totalAutoTracked.toLong()}. $unclassifiedCount transactions need your input.")
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(2001, notification)
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannels(
                listOf(
                    NotificationChannel(
                        CHANNEL_ATM,
                        "ATM Spending Prompts",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Asks where cash was spent after ATM withdrawals"
                    },
                    NotificationChannel(
                        CHANNEL_WEEKLY,
                        "Weekly Review",
                        NotificationManager.IMPORTANCE_DEFAULT
                    ).apply {
                        description = "Sunday evening summary of the week's spending"
                    },
                    NotificationChannel(
                        CHANNEL_GENERAL,
                        "Savery Insights",
                        NotificationManager.IMPORTANCE_DEFAULT
                    ).apply {
                        description = "Spending insights and alerts"
                    }
                )
            )
        }
    }
}
