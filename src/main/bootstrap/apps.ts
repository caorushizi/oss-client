import { AppStore, getAppById } from "../store/apps";

export async function initApp(id: string): Promise<AppStore> {
  const app = await getAppById(id);
  return app;
}
