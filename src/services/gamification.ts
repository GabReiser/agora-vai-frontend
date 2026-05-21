import { request } from "./api";

// ===== DTOs (REST-ready) =====
export type TierId = "iron" | "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface TierDTO {
  id: TierId;
  name: string;
  minLevel: number;
  /** OKLCH color used for badge tinting. */
  color: string;
  /** Secondary OKLCH used in gradient. */
  accent: string;
}

export interface GamificationProfileDTO {
  userId: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentTier: TierId;
  missionsCompleted: number;
  streakDays: number;
}

export type MissionStatus = "pending" | "in_progress" | "completed";
export type MissionCadence = "daily" | "weekly";

export interface MissionDTO {
  id: string;
  title: string;
  description: string;
  cadence: MissionCadence;
  xpReward: number;
  progress: number; // 0..target
  target: number;
  status: MissionStatus;
}

export interface LeaderboardPositionDTO {
  userId: string;
  name: string;
  avatarInitials: string;
  level: number;
  xpWeek: number;
  position: number;
  isCurrentUser?: boolean;
}

export interface WeeklyRewardDTO {
  id: string;
  title: string;
  description: string;
  endsAt: string; // ISO
}

// ===== Tiers catalog =====
export const TIERS: Record<TierId, TierDTO> = {
  iron:     { id: "iron",     name: "Ferro",    minLevel: 1,  color: "oklch(0.55 0.02 250)", accent: "oklch(0.78 0.02 250)" },
  bronze:   { id: "bronze",   name: "Bronze",   minLevel: 5,  color: "oklch(0.55 0.12 55)",  accent: "oklch(0.78 0.12 55)" },
  silver:   { id: "silver",   name: "Prata",    minLevel: 10, color: "oklch(0.7 0.02 250)",  accent: "oklch(0.88 0.02 250)" },
  gold:     { id: "gold",     name: "Ouro",     minLevel: 18, color: "oklch(0.78 0.14 85)",  accent: "oklch(0.9 0.14 85)" },
  platinum: { id: "platinum", name: "Platina",  minLevel: 28, color: "oklch(0.78 0.1 195)",  accent: "oklch(0.9 0.1 195)" },
  diamond:  { id: "diamond",  name: "Diamante", minLevel: 40, color: "oklch(0.75 0.15 250)", accent: "oklch(0.9 0.12 230)" },
};

// ===== Mock state =====
let profile: GamificationProfileDTO = {
  userId: "u_1",
  level: 7,
  xp: 320,
  xpToNextLevel: 500,
  currentTier: "bronze",
  missionsCompleted: 14,
  streakDays: 3,
};

let missions: MissionDTO[] = [
  { id: "m1", title: "Ofensiva de 3 dias", description: "Registre gastos por 3 dias seguidos.", cadence: "daily",  xpReward: 60, progress: 2, target: 3, status: "in_progress" },
  { id: "m2", title: "Delivery sob controle", description: "Fique abaixo de R$ 150 em Delivery esta semana.", cadence: "weekly", xpReward: 120, progress: 110, target: 150, status: "in_progress" },
  { id: "m3", title: "Revisão semanal", description: "Confira o dashboard pelo menos 1 vez nesta semana.", cadence: "weekly", xpReward: 40, progress: 0, target: 1, status: "pending" },
  { id: "m4", title: "Organização mestre", description: "Categorize 10 lançamentos.", cadence: "weekly", xpReward: 80, progress: 4, target: 10, status: "in_progress" },
  { id: "m5", title: "Meta batida", description: "Conclua uma meta de economia.", cadence: "weekly", xpReward: 150, progress: 1, target: 1, status: "completed" },
];

const leaderboard: LeaderboardPositionDTO[] = [
  { userId: "u_9", name: "Marina Alves", avatarInitials: "MA", level: 12, xpWeek: 980, position: 1 },
  { userId: "u_7", name: "Diego Costa",  avatarInitials: "DC", level: 11, xpWeek: 870, position: 2 },
  { userId: "u_1", name: "Você",         avatarInitials: "VC", level: 7,  xpWeek: 640, position: 3, isCurrentUser: true },
  { userId: "u_4", name: "Pedro Lima",   avatarInitials: "PL", level: 8,  xpWeek: 540, position: 4 },
  { userId: "u_5", name: "Ana Souza",    avatarInitials: "AS", level: 6,  xpWeek: 410, position: 5 },
  { userId: "u_6", name: "Bruno Reis",   avatarInitials: "BR", level: 5,  xpWeek: 320, position: 6 },
  { userId: "u_8", name: "Júlia Mendes", avatarInitials: "JM", level: 4,  xpWeek: 210, position: 7 },
];

const weeklyReward: WeeklyRewardDTO = {
  id: "wr_1",
  title: "7 dias de Plano Pro",
  description: "O 1º lugar da semana desbloqueia 7 dias de Plano Pro grátis!",
  endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
};

function applyXp(amount: number) {
  profile = { ...profile, xp: profile.xp + amount };
  while (profile.xp >= profile.xpToNextLevel) {
    profile = {
      ...profile,
      xp: profile.xp - profile.xpToNextLevel,
      level: profile.level + 1,
      xpToNextLevel: Math.round(profile.xpToNextLevel * 1.15),
    };
  }
  // Bump tier based on level thresholds
  const tierOrder: TierId[] = ["iron", "bronze", "silver", "gold", "platinum", "diamond"];
  let nextTier: TierId = "iron";
  for (const t of tierOrder) if (profile.level >= TIERS[t].minLevel) nextTier = t;
  profile = { ...profile, currentTier: nextTier };
}

export const gamificationService = {
  async getProfile(): Promise<GamificationProfileDTO> {
    return request<GamificationProfileDTO>("GET", "/gamification/profile", undefined, 200).then(() => ({ ...profile }));
  },
  async getMissions(): Promise<MissionDTO[]> {
    return request<MissionDTO[]>("GET", "/gamification/missions", undefined, 200).then(() => missions.map((m) => ({ ...m })));
  },
  async completeMission(missionId: string): Promise<{ profile: GamificationProfileDTO; mission: MissionDTO; gainedXp: number }> {
    await request("POST", `/gamification/missions/${missionId}/complete`, {}, 250);
    const idx = missions.findIndex((m) => m.id === missionId);
    if (idx < 0) throw new Error("Mission not found");
    const m = missions[idx];
    const gainedXp = m.status === "completed" ? 0 : m.xpReward;
    const updated: MissionDTO = { ...m, progress: m.target, status: "completed" };
    missions = missions.map((mm, i) => (i === idx ? updated : mm));
    if (gainedXp > 0) {
      profile = { ...profile, missionsCompleted: profile.missionsCompleted + 1 };
      applyXp(gainedXp);
    }
    return { profile: { ...profile }, mission: updated, gainedXp };
  },
  async getLeaderboard(): Promise<LeaderboardPositionDTO[]> {
    return request<LeaderboardPositionDTO[]>("GET", "/gamification/leaderboard", undefined, 200)
      .then(() => leaderboard.map((p) => ({ ...p })));
  },
  async getWeeklyReward(): Promise<WeeklyRewardDTO> {
    return request<WeeklyRewardDTO>("GET", "/gamification/rewards/weekly", undefined, 150).then(() => ({ ...weeklyReward }));
  },
};
