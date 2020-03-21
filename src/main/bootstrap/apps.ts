import { AppStore, getAppById } from "../store/apps";

export function initApp(id: string): Promise<AppStore> {
  return getAppById(id);
}
