package com.savery.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.concurrent.TimeUnit

/**
 * BroadcastReceiver that listens for incoming SMS messages.
 * When a bank SMS is detected, it enqueues a WorkManager job to
 * parse and categorize it in the background — off the main thread.
 *
 * Privacy: Only the message body and timestamp are passed to WorkManager.
 * Raw SMS is never stored in Supabase — only structured JSON.
 */
class SmsReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "SmsReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        // Reconstruct full message body (SMS can be split across parts)
        val fullBody = messages.joinToString("") { it.messageBody ?: "" }
        val timestamp = messages.firstOrNull()?.timestampMillis ?: System.currentTimeMillis()

        Log.d(TAG, "SMS received. Is bank SMS: ${SmsParser.isBankSms(fullBody)}")

        if (!SmsParser.isBankSms(fullBody)) return

        // Enqueue background parsing work
        val workRequest = OneTimeWorkRequestBuilder<SmsWorker>()
            .setInputData(
                workDataOf(
                    SmsWorker.KEY_SMS_BODY to fullBody,
                    SmsWorker.KEY_TIMESTAMP to timestamp
                )
            )
            .build()

        WorkManager.getInstance(context).enqueue(workRequest)
        Log.d(TAG, "SmsWorker enqueued for parsing")
    }
}
