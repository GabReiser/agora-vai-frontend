import { request } from "./api";

export interface AdminMetrics {
  totalUsers: number;
  proUsers: number;
  conversionRate: number;
  requests24h: number;
  mrr: number;
  series: { day: string; users: number; requests: number }[];
}

export const adminService = {
  async metrics(): Promise<AdminMetrics> {
    const series = Array.from({ length: 14 }).map((_, i) => ({
      day: `D${i + 1}`,
      users: 120 + Math.round(Math.sin(i / 2) * 40 + i * 8),
      requests: 800 + Math.round(Math.cos(i / 3) * 200 + i * 60),
    }));
    return request("GET", "/admin/metrics", {
      totalUsers: 12480,
      proUsers: 1832,
      conversionRate: 14.7,
      requests24h: 48230,
      mrr: 58420,
      series,
    });
  },
};
