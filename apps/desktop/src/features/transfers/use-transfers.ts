import useSWR from "swr";
import type { components } from "../../generated/api";

export type TransferTask = components["schemas"]["TransferTask"];

export function useTransfers() {
  return useSWR<TransferTask[]>("/api/v1/transfers", {
    refreshInterval: 750,
  });
}
