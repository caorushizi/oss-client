import { remote } from "electron";

export function dialog() {
  return remote.dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"]
  });
}
