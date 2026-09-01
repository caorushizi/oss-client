import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serviceDir = resolve(workspaceRoot, "services/oss-sidecar");
const binariesDir = resolve(workspaceRoot, "apps/desktop/src-tauri/binaries");
const targetArgumentIndex = process.argv.indexOf("--target");

if (targetArgumentIndex >= 0 && !process.argv[targetArgumentIndex + 1]) {
  throw new Error("--target 需要 Rust target triple 参数");
}

const inlineTarget = process.argv.find((argument) =>
  argument.startsWith("--target="),
);
const explicitTarget =
  targetArgumentIndex >= 0
    ? process.argv[targetArgumentIndex + 1]
    : inlineTarget?.slice("--target=".length);
const supportedArguments = new Set(
  explicitTarget
    ? targetArgumentIndex >= 0
      ? ["--target", explicitTarget]
      : [inlineTarget]
    : [],
);
const unknownArguments = process.argv
  .slice(2)
  .filter((argument) => !supportedArguments.has(argument));

if (unknownArguments.length > 0) {
  throw new Error(`不支持的参数：${unknownArguments.join(" ")}`);
}

const targetTriple =
  explicitTarget ??
  execFileSync("rustc", ["--print", "host-tuple"], {
    encoding: "utf8",
  }).trim();

if (!targetTriple) {
  throw new Error("无法确定当前 Rust target triple");
}

mkdirSync(binariesDir, { recursive: true });

const { goarch, goos } = goTargetForRustTriple(targetTriple);
const extension = goos === "windows" ? ".exe" : "";
const output = resolve(binariesDir, `oss-sidecar-${targetTriple}${extension}`);

execFileSync(
  "go",
  [
    "build",
    "-trimpath",
    "-buildvcs=false",
    "-ldflags=-s -w -buildid=",
    "-o",
    output,
    "./cmd/oss-sidecar",
  ],
  {
    cwd: serviceDir,
    env: {
      ...process.env,
      CGO_ENABLED: "0",
      GOARCH: goarch,
      GOOS: goos,
    },
    stdio: "inherit",
  },
);

console.log(`Go sidecar 已生成：${output}`);

function goTargetForRustTriple(target) {
  const goarch = target.startsWith("x86_64-")
    ? "amd64"
    : target.startsWith("aarch64-")
      ? "arm64"
      : undefined;
  const goos = target.includes("-pc-windows-")
    ? "windows"
    : target.endsWith("-apple-darwin")
      ? "darwin"
      : target.includes("-linux-")
        ? "linux"
        : undefined;

  if (!goarch || !goos) {
    throw new Error(`不支持的 sidecar target：${target}`);
  }

  return { goarch, goos };
}
