import { BaseQueryFn } from "@reduxjs/toolkit/query/react";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

instance.interceptors.response.use(
  (response) => {
    const { data } = response;

    if (data.code !== 0) {
      return Promise.reject(new Error(data.msg));
    }

    return data.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method: AxiosRequestConfig["method"];
      data?: AxiosRequestConfig["data"];
      params?: AxiosRequestConfig["params"];
      headers?: AxiosRequestConfig["headers"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await instance({
        url,
        method,
        data,
        params,
        headers,
      });
      console.log("http result: ", result);
      return { data: result };
    } catch (axiosError) {
      console.log("http error: ", axiosError);
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default instance;
