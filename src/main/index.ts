import bootstrap from "./bootstrap";
import App from "./app";

const app = new App();
bootstrap(app).then(r => r);
