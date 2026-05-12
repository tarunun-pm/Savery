package com.savery.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.app.NotificationManager
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf

/**
 * Handles one-tap category actions from ATM prompt notifications.
 * User taps "Groceries" in the notification → this receiver logs the transaction
 * without the user ever opening the app.
 */
class SmsQuickLogReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val amount = intent.getDoubleExtra("amount", 0.0)
        val category = intent.getStringExtra("category") ?: "Others"
        val notificationId = intent.getIntExtra("notification_id", 0)

        Log.d("SmsQuickLogReceiver", "Quick log: ₹$amount → $category")

        // Dismiss the notification
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancel(notificationId)

        // Enqueue a work request to log the cash transaction
        val work = OneTimeWorkRequestBuilder<QuickLogWorker>()
            .setInputData(workDataOf(
                QuickLogWorker.KEY_AMOUNT to amount,
                QuickLogWorker.KEY_CATEGORY to category
            ))
            .build()

        WorkManager.getInstance(context).enqueue(work)
    }
}
