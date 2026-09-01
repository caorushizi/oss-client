import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serviceDir = resolve(workspaceRoot, "services/oss-sidecar");
const binariesDir = resolve(workspaceRoot, "apps/desktop/src-tauri/binaries");
const targetTriple = execFileSync("rustc", ["--print", "host-tuple"], {
  encoding: "utf8",
}).trim();

if (!targetTriple) {
  throw new Error("无法确定当前 Rust target triple");
}

mkdirSync(binariesDir, { recursive: true });

const extension = process.platform === "win32" ? ".exe" : "";
const output = resolve(binariesDir, `oss-sidecar-${targetTriple}${extension}`);

execFileSync(
  "go",
  ["build", "-trimpath", "-ldflags=-s -w", "-o", output, "./cmd/oss-sidecar"],
  {
    cwd: serviceDir,
    stdio: "inherit",
  },
);

console.log(`Go sidecar 已生成：${output}`);
