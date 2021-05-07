import { remote } from "../../common/script/electron";

export function dialog() {
  return remote.dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"]
  });
}
