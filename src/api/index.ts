import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export function getBuckets(): Promise<string[]> {
  return instance.post("/api/buckets", {
    ak: import.meta.env.VITE_API_KEY,
    sk: import.meta.env.VITE_API_SECRET,
  });
}
