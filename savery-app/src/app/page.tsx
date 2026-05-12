"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SplashScreen from "@/components/splash/SplashScreen";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  useEffect(() => {
    if (showSplash) return;

    // After splash, check auth + onboarding status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.push("/auth");
        return;
      }

      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("onboarding_complete")
        .eq("user_id", session.user.id)
        .single();

      if (!profile || !profile.onboarding_complete) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    });
  }, [showSplash, router]);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Loading state while checking session
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--white)",
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: "3px solid var(--gray-border)",
        borderTopColor: "var(--lime-primary)",
        borderRadius: "50%",
        animation: "spin 600ms linear infinite",
      }} />
    </div>
  );
}
