import useSWRInfinite from "swr/infinite";
import type { components } from "../../generated/api";

export type ObjectPage = components["schemas"]["ObjectPage"];
export type StorageObject = components["schemas"]["Object"];

interface BucketReference {
  name: string;
  region?: string;
}

export function useObjects(
  profileId?: string,
  bucket?: BucketReference,
  prefix = "",
) {
  const response = useSWRInfinite<ObjectPage>(
    (_pageIndex, previousPage) => {
      if (!profileId || !bucket || (previousPage && !previousPage.hasMore)) {
        return null;
      }

      const query = new URLSearchParams({
        bucket: bucket.name,
        prefix,
        limit: "200",
      });
      if (bucket.region) {
        query.set("region", bucket.region);
      }
      if (previousPage?.cursor) {
        query.set("cursor", previousPage.cursor);
      }
      return `/api/v1/profiles/${profileId}/objects?${query}`;
    },
    { revalidateFirstPage: false },
  );

  const lastPage = response.data?.at(-1);
  return {
    ...response,
    items: response.data?.flatMap((page) => page.items),
    hasMore: lastPage?.hasMore ?? false,
    loadMore: () => response.setSize((size) => size + 1),
  };
}
