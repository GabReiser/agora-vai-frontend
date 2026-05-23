import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { GamificationProvider } from "@/components/gamification-provider";
import { ChatAssistant } from "@/components/chat-assistant";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const titles: Record<string, string> = {
  "/app": "Dashboard",
  "/app/lancamentos": "Lançamentos",
  "/app/assinaturas": "Assinaturas",
  "/app/ranking": "Ranking & Missões",
  "/app/insights": "Insights",
  "/app/configuracoes": "Configurações",
};

function AppLayout() {
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/login" });
    }
  }, [loading, nav, user]);

  if (loading || !user || !profile) return null;

  const title = titles[path] ?? "Agora Vai";

  return (
    <GamificationProvider>
      <div className="min-h-screen flex bg-background items-start">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppTopbar profile={profile} title={title} />
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
        <ChatAssistant />
      </div>
    </GamificationProvider>
  );
}
