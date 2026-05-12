import AuthPage from "@/components/auth/AuthPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Savery — Sign In",
  description: "Sign in to your Savery account to understand your spending.",
};

export default function AuthRoute() {
  return <AuthPage />;
}
