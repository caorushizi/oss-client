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
  tagTypes: ["Buckets"],
  endpoints: (builder) => ({
    getApps: builder.query({
      query: () => ({ url: "/api/apps", method: "get" }),
      providesTags: ["Buckets"],
    }),
    addApp: builder.mutation({
      query: (app: AppForm) => ({
        url: "/api/apps",
        method: "post",
        data: app,
      }),
      invalidatesTags: ["Buckets"],
    }),
    getBuckets: builder.query({
      query: (name: string) => ({
        url: "/api/buckets",
        method: "post",
        data: { name },
      }),
    }),
  }),
});

export const { useGetAppsQuery, useAddAppMutation, useGetBucketsQuery } =
  appApi;
