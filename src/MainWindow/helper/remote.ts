// eslint-disable-next-line import/no-extraneous-dependencies
import { remote } from "electron";

export function dialog() {
  return remote.dialog.showOpenDialog({ properties: ["openFile", "multiSelections"] });
}
