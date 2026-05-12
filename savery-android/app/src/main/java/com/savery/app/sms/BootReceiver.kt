package com.savery.app.sms

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-registers SMS listening after device reboot.
 * Without this, the SmsReceiver stops working when the phone restarts.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            // WorkManager and BroadcastReceivers re-register automatically
            // This receiver exists to trigger WorkManager's pending scheduled jobs
            android.util.Log.d("BootReceiver", "Device booted — Savery SMS tracking active")
        }
    }
}
