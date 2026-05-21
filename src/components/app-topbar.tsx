import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, User as UserIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authService, type User } from "@/services/auth";

export function AppTopbar({ user, title }: { user: User; title: string }) {
  const nav = useNavigate();
  const isPro = user.plan === "pro";
  return (
    <header className="h-16 border-b border-border bg-background/80 backdrop-blur sticky top-0 z-30 flex items-center px-4 md:px-8 gap-4">
      <h1 className="font-display text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
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
