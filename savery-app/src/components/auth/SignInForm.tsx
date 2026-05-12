"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./AuthPage.module.css";

interface SignInFormProps {
  onError: (msg: string) => void;
  onLoading: (loading: boolean) => void;
}

export default function SignInForm({ onError, onLoading }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof fieldErrors = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError("");
    if (!validate()) return;

    setLoading(true);
    onLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        onError(error.message);
      } else if (data.session) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_complete")
          .eq("user_id", data.session.user.id)
          .single();

        if (!profile || !profile.onboarding_complete) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      onError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Email */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="signin-email">
          Email
        </label>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.inputIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            id="signin-email"
            type="email"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ""}`}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
            }}
            autoComplete="email"
          />
        </div>
        {fieldErrors.email && (
          <span className={styles.errorText}>{fieldErrors.email}</span>
        )}
      </div>

      {/* Password */}
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel} htmlFor="signin-password">
          Password
        </label>
        <div className={styles.inputWrapper}>
          <svg
            className={styles.inputIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ""}`}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((p) => ({ ...p, password: undefined }));
            }}
            autoComplete="current-password"
          />
          <svg
            className={styles.eyeToggle}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => setShowPassword(!showPassword)}
            role="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowPassword(!showPassword);
            }}
          >
            {showPassword ? (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </>
            )}
          </svg>
        </div>
        {fieldErrors.password && (
          <span className={styles.errorText}>{fieldErrors.password}</span>
        )}
      </div>

      {/* Forgot password */}
      <div className={styles.forgotRow}>
        <a href="#" className={styles.forgotLink}>
          Forgot password?
        </a>
      </div>

      {/* Submit */}
      <button type="submit" className={styles.cta} disabled={loading} id="signin-submit">
        {loading ? <span className={styles.spinner} /> : "Sign In"}
      </button>
    </form>
  );
}
