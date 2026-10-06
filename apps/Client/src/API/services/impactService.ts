import api from "../index";
import type { CommunityStats, Impact } from "../../types";

// The home page shows community numbers in several sections; they share one
// request, reused for a minute (the server caches them for a minute too).
let community: { at: number; promise: Promise<CommunityStats> } | null = null;

export const impactService = {
  async mine(): Promise<Impact> {
    const { data } = await api.get<{ impact: Impact }>("/api/impact/me");
    return data.impact;
  },

  community(): Promise<CommunityStats> {
    if (!community || Date.now() - community.at > 60_000) {
      const promise = api.get<{ stats: CommunityStats }>("/api/impact/community").then(({ data }) => data.stats);
      promise.catch(() => {
        community = null;
      });
      community = { at: Date.now(), promise };
    }
    return community.promise;
  },
};
