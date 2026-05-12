"use client";

import { useEffect, useState } from "react";
import styles from "./SplashScreen.module.css";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 2400);
    const finishTimer = setTimeout(() => onFinish(), 2900);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`${styles.container} ${exiting ? styles.exiting : ""}`}>
      {/* Brand Image Logo */}
      <div className={styles.logoArea}>
        <img 
          src="/logo/savery-lemon-bg.png" 
          alt="Savery Logo" 
          className={styles.logoImage} 
        />
        <span className={styles.tagline}>Clarity over every choice.</span>
      </div>

      {/* Bottom progress loader */}
      <div className={styles.loaderTrack}>
        <div className={styles.loaderFill} />
      </div>
    </div>
  );
}
