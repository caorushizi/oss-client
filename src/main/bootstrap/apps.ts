import appStore from "../store/secrets";
import { SecretStore } from "../types";

export function initApp(id: string) {
  appStore.findOne({ id }, (err, app: SecretStore) => {
    console.log(app);
  });
}
