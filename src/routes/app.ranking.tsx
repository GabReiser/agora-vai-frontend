import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Gift, Sparkles, Trophy, Medal, Check, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/tier-badge";
import { useGamification } from "@/components/gamification-provider";
import {
  gamificationService, TIERS,
  type LeaderboardPositionDTO, type MissionDTO, type WeeklyRewardDTO,
} from "@/services/gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/ranking")({
  component: RankingPage,
});

function RankingPage() {
  const { profile, tier, triggerXpGain } = useGamification();
  const [missions, setMissions] = useState<MissionDTO[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPositionDTO[]>([]);
  const [reward, setReward] = useState<WeeklyRewardDTO | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    gamificationService.getMissions().then(setMissions);
    gamificationService.getLeaderboard().then(setLeaderboard);
    gamificationService.getWeeklyReward().then(setReward);
  }, []);

  async function handleComplete(m: MissionDTO, e: React.MouseEvent<HTMLButtonElement>) {
    if (m.status === "completed" || pendingId) return;
    setPendingId(m.id);
    const rect = e.currentTarget.getBoundingClientRect();
    const from = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    // Optimistic fill
    setMissions((cur) => cur.map((mm) => mm.id === m.id ? { ...mm, progress: mm.target, status: "completed" } : mm));
    const res = await gamificationService.completeMission(m.id);
    if (res.gainedXp > 0) triggerXpGain(res.gainedXp, from);
    setPendingId(null);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header / Tier showcase */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="relative overflow-hidden border-0 shadow-xl">
          <div className="absolute inset-0 gradient-hero" />
          <div
            className="absolute -top-20 -right-20 size-72 rounded-full blur-3xl opacity-60"
            style={{ background: tier ? `radial-gradient(circle, ${tier.color}, transparent 70%)` : undefined }}
          />
          <CardContent className="relative p-8 flex items-center gap-6">
            {tier && <TierBadge tier={tier} size="xl" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Seu Elo atual</p>
              <h2 className="font-display text-4xl font-bold mt-1">{tier?.name ?? "—"}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Level <strong className="text-foreground">{profile?.level ?? 0}</strong> · {profile?.missionsCompleted ?? 0} missões concluídas
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="gap-1.5 gradient-primary text-primary-foreground border-0">
                  <Flame className="size-3.5" /> {profile?.streakDays ?? 0} dias seguidos
                </Badge>
                <Badge variant="secondary" className="gap-1.5">
                  <Sparkles className="size-3.5" /> {profile?.xp ?? 0}/{profile?.xpToNextLevel ?? 0} XP
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier ladder */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ligas competitivas</CardTitle>
            <CardDescription>Suba de elo conquistando XP e completando missões.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {(Object.values(TIERS)).map((t) => {
                const active = profile?.currentTier === t.id;
                return (
                  <div key={t.id} className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl p-2 transition",
                    active ? "bg-accent ring-2 ring-primary/40" : "opacity-70 hover:opacity-100",
                  )}>
                    <TierBadge tier={t} size="md" />
                    <span className="text-[11px] font-semibold">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">Lvl {t.minLevel}+</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Weekly reward banner */}
      {reward && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-primary-foreground shadow-xl gradient-primary"
        >
          <div className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(600px 200px at 80% 0%, rgba(255,255,255,.5), transparent 60%)" }}
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="size-14 grid place-items-center rounded-2xl bg-white/15 backdrop-blur ring-1 ring-white/30">
              <Gift className="size-7" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest opacity-80 font-semibold">Recompensa da semana</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold mt-1">{reward.title}</h3>
              <p className="opacity-90 mt-1 text-sm md:text-base">{reward.description}</p>
            </div>
            <Badge className="bg-white/15 text-white border-white/30 backdrop-blur gap-1.5">
              <Clock className="size-3.5" /> Termina em breve
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Missions */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Missões</h2>
            <p className="text-sm text-muted-foreground">Conclua para ganhar XP e subir no ranking.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((m) => {
            const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
            const done = m.status === "completed";
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative rounded-2xl border bg-card p-5 transition",
                  done
                    ? "border-primary/40 shadow-[0_0_0_1px_var(--primary),0_10px_40px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
                    : "border-border hover:border-primary/30",
                )}
              >
                {done && (
                  <div className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{ background: "radial-gradient(400px 120px at 50% 0%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 60%)" }}
                  />
                )}
                <div className="relative flex items-start gap-3">
                  <div className={cn(
                    "size-10 grid place-items-center rounded-xl shrink-0",
                    done ? "gradient-primary text-primary-foreground" : "bg-accent text-accent-foreground",
                  )}>
                    {done ? <Check className="size-5" /> : <Sparkles className="size-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold leading-tight">{m.title}</h3>
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {m.cadence === "daily" ? "Diária" : "Semanal"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  </div>
                  <span className="text-xs font-bold text-primary whitespace-nowrap">+{m.xpReward} XP</span>
                </div>
                <div className="relative mt-4 space-y-2">
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                    <span>{m.progress}/{m.target}</span>
                    <span>{pct}%</span>
                  </div>
                </div>
                <Button
                  onClick={(e) => handleComplete(m, e)}
                  disabled={done || pendingId === m.id}
                  size="sm"
                  className="relative mt-4 w-full"
                  variant={done ? "secondary" : "default"}
                >
                  {done ? "Concluída" : pendingId === m.id ? "Validando..." : "Concluir missão"}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Ranking entre amigos</h2>
            <p className="text-sm text-muted-foreground">Disputa semanal — reinicia toda segunda-feira.</p>
          </div>
        </div>
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {leaderboard.map((p) => {
              const top1 = p.position === 1;
              const top2 = p.position === 2;
              const top3 = p.position === 3;
              const medalColor = top1
                ? "from-amber-300 to-yellow-500"
                : top2
                ? "from-zinc-200 to-zinc-400"
                : top3
                ? "from-orange-300 to-orange-500"
                : "";
              return (
                <div
                  key={p.userId}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3",
                    p.isCurrentUser && "bg-accent/40",
                  )}
                >
                  <div className={cn(
                    "size-9 grid place-items-center rounded-full text-sm font-bold shrink-0",
                    top1 || top2 || top3
                      ? `bg-gradient-to-br ${medalColor} text-white shadow`
                      : "bg-muted text-muted-foreground",
                  )}>
                    {top1 || top2 || top3 ? <Medal className="size-4" /> : p.position}
                  </div>
                  <div className="size-10 rounded-full bg-secondary text-secondary-foreground grid place-items-center font-semibold text-sm">
                    {p.avatarInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium leading-tight truncate">
                      {p.name}{p.isCurrentUser && <span className="ml-2 text-xs text-primary font-semibold">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Level {p.level}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                    <Trophy className="size-4 text-primary" />
                    {p.xpWeek} XP
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
