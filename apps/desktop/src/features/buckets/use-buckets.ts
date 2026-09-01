import useSWR from "swr";
import type { components } from "../../generated/api";

export type Bucket = components["schemas"]["Bucket"];

export function useBuckets(profileId?: string) {
  return useSWR<Bucket[]>(
    profileId ? `/api/v1/profiles/${profileId}/buckets` : null,
  );
}
