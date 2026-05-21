import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, LogOut, Moon, Sun, User as UserIcon, Zap } from "lucide-react";
import { useTheme } from "@/lib/theme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService, type User } from "@/services/auth";
import { useGamification } from "@/components/gamification-provider";
import { TierBadge } from "@/components/tier-badge";

function XpProgress() {
  const { profile, tier, registerXpTarget } = useGamification();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    registerXpTarget(ref.current);
    return () => registerXpTarget(null);
  }, [registerXpTarget]);

  if (!profile || !tier) {
    return <div className="hidden md:flex h-10 w-64 animate-pulse rounded-xl bg-muted" />;
  }

  const pct = Math.min(100, Math.round((profile.xp / profile.xpToNextLevel) * 100));

  return (
    <div
      ref={ref}
      className="hidden md:flex items-center gap-3 rounded-xl border border-border bg-card/70 backdrop-blur px-3 py-1.5 shadow-sm"
    >
      <TierBadge tier={tier} size="sm" />
      <div className="flex flex-col min-w-[200px]">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="flex items-center gap-1 text-foreground">
            <span className="font-display font-bold">Lvl {profile.level}</span>
            <span className="text-muted-foreground">· {tier.name}</span>
          </span>
          <span className="text-muted-foreground tabular-nums">
            {profile.xp}/{profile.xpToNextLevel} XP
          </span>
        </div>
        <div className="relative mt-1 h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 gradient-primary"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)" }}
          />
        </div>
      </div>
      <Zap className="size-4 text-primary" />
    </div>
  );
}

export function AppTopbar({ user, title }: { user: User; title: string }) {
  const nav = useNavigate();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isPro = user.plan === "pro";
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 md:px-8 gap-4">
      <h1 className="font-display text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <XpProgress />
        <Badge
          variant="secondary"
          className={
            isPro
              ? "gradient-primary text-primary-foreground border-0 shadow-sm"
              : "bg-muted text-muted-foreground"
          }
        >
          Plano {isPro ? "Pro" : "Free"}
        </Badge>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="size-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1 pr-3 rounded-full">
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">{user.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav({ to: "/app/configuracoes" })}>
              <UserIcon className="size-4" /> Configurações
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggle(); }}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {isDark ? "Modo claro" : "Modo escuro"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => { await authService.logout(); nav({ to: "/login" }); }}
            >
              <LogOut className="size-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
