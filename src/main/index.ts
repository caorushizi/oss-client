import bootstrap from "./bootstrap";
import App from "./app";

const app = new App();
(async () => {
  await bootstrap(app);
})();
