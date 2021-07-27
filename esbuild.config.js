const { createServer } = require("vite");
const chalk = require("chalk");
const { resolve } = require("path");
const electron = require("electron");
const reactRefresh = require("@vitejs/plugin-react-refresh");
const path = require("path");
const { spawn } = require("child_process");

let electronProcess = null;

require("dotenv").config({
  path: resolve(__dirname, `.env.${process.env.NODE_ENV}`),
});

function startMain() {
  return require("esbuild").build({
    entryPoints: [resolve(__dirname, "./src/main/index.ts")],
    bundle: true,
    platform: "node",
    sourcemap: true,
    target: ["node10.4"],
    external: ["electron"],
    define: {
      // 开发环境中二进制可执行文件的路径
      __bin__: `"${resolve(__dirname, ".bin").replace(/\\/g, "\\\\")}"`,
    },
    outdir: resolve(__dirname, "./dist/main"),
    loader: { ".png": "file" },
  });
}

function startRenderer() {
  return createServer({
    // 任何合法的用户配置选项，加上 `mode` 和 `configFile`
    configFile: false,
    root: __dirname,
    server: {
      port: 1337,
    },
    plugins: [reactRefresh()],
  });
}

function startElectron() {
  let args = ["--inspect=5858", path.join(__dirname, "./dist/main/index.js")];

  electronProcess = spawn(electron, args);

  electronProcess.stdout.on("data", (data) => {
    electronLog(data, "blue");
  });
  electronProcess.stderr.on("data", (data) => {
    electronLog(data, "red");
  });
}

function electronLog(data, color) {
  let log = "";
  data = data.toString().split(/\r?\n/);
  data.forEach((line) => {
    log += `  ${line}\n`;
  });
  if (/[0-9A-z]+/.test(log)) {
    console.log(
      chalk[color].bold("┏ Electron -------------------") +
        "\n\n" +
        log +
        chalk[color].bold("┗ ----------------------------") +
        "\n"
    );
  }
}

(async () => {
  try {
    const [server] = await Promise.all([startRenderer(), startMain()]);
    await server.listen();
    startElectron();
  } catch (e) {
    console.error(e);
  }
})();
