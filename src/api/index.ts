import axios from "axios";

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

export function getBuckets(): Promise<string[]> {
  return instance.post("/api/buckets", {
    ak: import.meta.env.VITE_API_KEY,
    sk: import.meta.env.VITE_API_SECRET,
  });
}

export interface AppForm {
  type: string;
  name: string;
  ak: string;
  sk: string;
}
export function addApp(app: AppForm): Promise<string> {
  return instance.post("/api/apps", app);
}

export function getApps(): Promise<AppForm[]> {
  console.log(import.meta.env.VITE_API_URL, "123123");
  return instance.get("/api/apps");
}
