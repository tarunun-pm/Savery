import AppShell from "@/components/shell/AppShell";
import LemonChat from "@/components/chat/LemonChat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <LemonChat />
    </AppShell>
  );
}
