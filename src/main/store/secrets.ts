import { app } from "electron";
import DataStore from "nedb";
import * as path from "path";
import { OssType } from "../types";

type secrets = {
  ak: string;
  sk: string;
  name: string;
  type: OssType;
};

const filename = path.join(app.getPath("downloads"), "N0oaHNL5");
export default new DataStore<secrets>({ filename });
