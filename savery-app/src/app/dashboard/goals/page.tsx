"use client";

import styles from "./GoalsPlaceholder.module.css";

export default function GoalsPage() {
  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.title}>Goals</h1>
        <p className={styles.subtitle}>Set spending targets and track progress</p>
      </div>

      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🎯</span>
        <h2 className={styles.emptyTitle}>Coming Soon</h2>
        <p className={styles.emptyText}>
          Set smart savings goals and track your progress with AI-powered guidance. We&apos;re building this for you!
        </p>
      </div>
    </div>
  );
}
