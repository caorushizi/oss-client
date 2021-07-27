const concurrently = require("concurrently");
const path = require("path");

concurrently(
  [
    "npm:watch-*",
    { command: "nodemon", name: "server" },
    { command: "deploy", name: "deploy", env: { PUBLIC_KEY: "..." } },
    {
      command: "watch",
      name: "watch",
      cwd: path.resolve(__dirname, "scripts/watchers"),
    },
  ],
  {
    prefix: "name",
    killOthers: ["failure", "success"],
    restartTries: 3,
    cwd: path.resolve(__dirname, "scripts"),
  }
).then(success, failure);
