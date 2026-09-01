import useSWR from "swr";
import type { components } from "../../generated/api";

export type Profile = components["schemas"]["Profile"];

export function useProfiles() {
  return useSWR<Profile[]>("/api/v1/profiles");
}
