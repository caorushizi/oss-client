import useSWR from "swr";

interface Health {
  status: "ok";
  version: string;
}

export function useHealth() {
  return useSWR<Health>("/api/v1/health", {
    refreshInterval: 10_000,
  });
}
