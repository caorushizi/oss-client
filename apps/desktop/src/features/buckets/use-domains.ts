import useSWR from "swr";

export function useDomains(profileId?: string, bucket?: string) {
  return useSWR<string[]>(
    profileId && bucket
      ? `/api/v1/profiles/${profileId}/buckets/${encodeURIComponent(bucket)}/domains`
      : null,
  );
}
