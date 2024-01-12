import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "../helper";

export interface AppForm {
  type: string;
  name: string;
  ak: string;
  sk: string;
}

export interface GetFilesForm {
  appName: string;
  bucket: string;
}

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Apps"],
  endpoints: (builder) => ({
    // appApi endpoints
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
    // bucketApi endpoints
    getBuckets: builder.query<string[], string>({
      query: (appName: string) => ({
        url: "/api/buckets",
        method: "post",
        data: { appName },
      }),
    }),
    // fileApi endpoints
    getFiles: builder.query<string[], GetFilesForm>({
      query: ({ appName, bucket }) => ({
        url: "/api/files",
        method: "post",
        data: { appName, bucket },
      }),
    }),
  }),
});

export const {
  useGetAppsQuery,
  useAddAppMutation,
  useGetBucketsQuery,
  useDeleteAppMutation,
  useGetFilesQuery,
} = appApi;
