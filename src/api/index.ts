import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../helper";

export interface AppForm {
  type: string;
  name: string;
  ak: string;
  sk: string;
}

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Apps"],
  endpoints: (builder) => ({
    getApps: builder.query<AppForm[], void>({
      query: () => ({ url: "/api/apps", method: "get" }),
      providesTags: ["Apps"],
    }),
    addApp: builder.mutation({
      query: (app: AppForm) => ({
        url: "/api/apps",
        method: "post",
        data: app,
      }),
      invalidatesTags: ["Apps"],
    }),
    deleteApp: builder.mutation<number, string>({
      query: (name: string) => ({
        url: "/api/apps",
        method: "delete",
        data: { name },
      }),
      invalidatesTags: ["Apps"],
    }),
    getBuckets: builder.query<string[], string>({
      query: (name: string) => ({
        url: "/api/buckets",
        method: "post",
        data: { name },
      }),
    }),
  }),
});

export const {
  useGetAppsQuery,
  useAddAppMutation,
  useGetBucketsQuery,
  useDeleteAppMutation,
} = appApi;
