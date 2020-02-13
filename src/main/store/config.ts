import { app } from "electron";
import DataStore from "nedb";
import * as path from "path";

type config = {
  cursor: string;
};

const filename = path.join(app.getPath("downloads"), "KRqCxicr");
export default new DataStore<config[]>({ filename });
