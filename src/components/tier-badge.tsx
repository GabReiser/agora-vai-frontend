import { Shield, Award, Gem, Crown, Hexagon, Trophy } from "lucide-react";
import type { TierDTO, TierId } from "@/services/gamification";
import { cn } from "@/lib/utils";

const ICONS: Record<TierId, React.ComponentType<{ className?: string }>> = {
  iron: Shield,
  bronze: Award,
  silver: Hexagon,
  gold: Trophy,
  platinum: Crown,
  diamond: Gem,
};

export function TierBadge({
  tier,
  size = "md",
  className,
}: {
  tier: TierDTO;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const Icon = ICONS[tier.id];
  const dim = {
    sm: "size-7",
    md: "size-10",
    lg: "size-16",
    xl: "size-28",
  }[size];
  const iconSize = {
    sm: "size-3.5",
    md: "size-5",
    lg: "size-8",
    xl: "size-14",
  }[size];
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-2xl shadow-lg ring-1 ring-white/20",
        dim,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${tier.color}, ${tier.accent})`,
        boxShadow: `0 8px 30px -8px ${tier.color}, inset 0 1px 0 rgba(255,255,255,.35)`,
      }}
    >
      <Icon className={cn("text-white drop-shadow", iconSize)} />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,.45), transparent 55%)",
        }}
      />
    </div>
  );
}
