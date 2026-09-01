import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  activeProfileId?: string;
  activeBucket?: {
    name: string;
    region?: string;
  };
  prefix: string;
  setActiveProfileId: (profileId?: string) => void;
  setActiveBucket: (bucket?: { name: string; region?: string }) => void;
  setPrefix: (prefix: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeProfileId: undefined,
      activeBucket: undefined,
      prefix: "",
      setActiveProfileId: (activeProfileId) =>
        set({ activeProfileId, activeBucket: undefined, prefix: "" }),
      setActiveBucket: (activeBucket) => set({ activeBucket, prefix: "" }),
      setPrefix: (prefix) => set({ prefix }),
    }),
    { name: "oss-client:app-state" },
  ),
);
