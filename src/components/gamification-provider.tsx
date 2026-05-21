import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gamificationService, type GamificationProfileDTO, TIERS, type TierDTO } from "@/services/gamification";

interface FlyingXp { id: number; amount: number; from: { x: number; y: number } }

interface Ctx {
  profile: GamificationProfileDTO | null;
  tier: TierDTO | null;
  refresh: () => Promise<void>;
  /** Notifies provider of XP gain originating at the given screen coords. */
  triggerXpGain: (amount: number, from: { x: number; y: number }) => void;
  /** Register the target element (XP bar in topbar) for the flying animation. */
  registerXpTarget: (el: HTMLElement | null) => void;
}

const GamificationCtx = createContext<Ctx | null>(null);

export function useGamification() {
  const c = useContext(GamificationCtx);
  if (!c) throw new Error("useGamification must be used inside GamificationProvider");
  return c;
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<GamificationProfileDTO | null>(null);
  const [flying, setFlying] = useState<FlyingXp[]>([]);
  const targetRef = useRef<HTMLElement | null>(null);
  const idRef = useRef(0);

  const refresh = useCallback(async () => {
    const p = await gamificationService.getProfile();
    setProfile(p);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const registerXpTarget = useCallback((el: HTMLElement | null) => {
    targetRef.current = el;
  }, []);

  const triggerXpGain = useCallback((amount: number, from: { x: number; y: number }) => {
    const id = ++idRef.current;
    setFlying((f) => [...f, { id, amount, from }]);
    // refresh profile shortly after to update bar
    window.setTimeout(() => { refresh(); }, 750);
    window.setTimeout(() => {
      setFlying((f) => f.filter((x) => x.id !== id));
    }, 1400);
  }, [refresh]);

  const tier = profile ? TIERS[profile.currentTier] : null;

  // Compute target coords each render of overlay
  const targetRect = typeof window !== "undefined" && targetRef.current
    ? targetRef.current.getBoundingClientRect()
    : null;

  return (
    <GamificationCtx.Provider value={{ profile, tier, refresh, triggerXpGain, registerXpTarget }}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        <AnimatePresence>
          {flying.map((f) => {
            const tx = targetRect ? targetRect.left + targetRect.width / 2 - f.from.x : 0;
            const ty = targetRect ? targetRect.top + targetRect.height / 2 - f.from.y : -200;
            return (
              <motion.div
                key={f.id}
                initial={{ x: f.from.x, y: f.from.y, opacity: 0, scale: 0.6 }}
                animate={{
                  x: [f.from.x, f.from.x + tx],
                  y: [f.from.y, f.from.y + ty],
                  opacity: [0, 1, 1, 0],
                  scale: [0.6, 1.2, 1, 0.7],
                }}
                transition={{ duration: 1.1, times: [0, 0.15, 0.7, 1], ease: "easeOut" }}
                exit={{ opacity: 0 }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="rounded-full gradient-primary text-primary-foreground text-sm font-bold px-3 py-1 shadow-lg shadow-primary/40 ring-2 ring-primary/30">
                  +{f.amount} XP
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GamificationCtx.Provider>
  );
}
