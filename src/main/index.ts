import bootstrap from "./bootstrap";
import App from "./app";
import { errorLog, infoLog } from "./logger";

infoLog("============= 开始程序 ===========");
bootstrap(new App())
  .then(r => r)
  .catch(error => {
    errorLog(error);
  });
infoLog("============= 结束程序 ===========");
