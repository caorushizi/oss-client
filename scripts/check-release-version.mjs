import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rootPackage = readJson("package.json");
const desktopPackage = readJson("apps/desktop/package.json");
const tauriConfig = readJson("apps/desktop/src-tauri/tauri.conf.json");
const cargoManifest = readText("apps/desktop/src-tauri/Cargo.toml");
const cargoLock = readText("apps/desktop/src-tauri/Cargo.lock");
const sidecarMain = readText("services/oss-sidecar/cmd/oss-sidecar/main.go");

const versions = new Map([
  ["package.json", rootPackage.version],
  ["apps/desktop/package.json", desktopPackage.version],
  ["apps/desktop/src-tauri/tauri.conf.json", tauriConfig.version],
  [
    "apps/desktop/src-tauri/Cargo.toml",
    matchVersion(cargoManifest, /^version\s*=\s*"([^"]+)"/m, "Cargo package"),
  ],
  [
    "services/oss-sidecar/cmd/oss-sidecar/main.go",
    matchVersion(sidecarMain, /^\s*version\s*=\s*"([^"]+)"/m, "Go sidecar"),
  ],
]);
const cargoLockVersion = localCargoLockVersion(cargoLock);
if (cargoLockVersion !== undefined) {
  versions.set("apps/desktop/src-tauri/Cargo.lock", cargoLockVersion);
}
const expectedVersion = rootPackage.version;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const mismatches = [...versions].filter(
  ([, version]) => version !== expectedVersion,
);

if (mismatches.length > 0) {
  console.error(`发布版本不一致，期望 ${expectedVersion}：`);
  for (const [file, version] of mismatches) {
    console.error(`- ${file}: ${version ?? "缺失"}`);
  }
  process.exit(1);
}

if (!semverPattern.test(expectedVersion)) {
  console.error(`仓库版本不是有效的 SemVer：${expectedVersion}`);
  process.exit(1);
}

const tag = releaseTag();
if (tag !== undefined) {
  const tagVersion = tag.startsWith("v") ? tag.slice(1) : "";
  if (!semverPattern.test(tagVersion)) {
    console.error(`发布 tag 格式无效：${tag}；应为 v<semver>`);
    process.exit(1);
  }
  if (tagVersion !== expectedVersion) {
    console.error(`发布 tag ${tag} 与仓库版本 ${expectedVersion} 不一致`);
    process.exit(1);
  }
}

console.log(`发布版本检查通过：${expectedVersion}${tag ? ` (${tag})` : ""}`);

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

function matchVersion(content, pattern, label) {
  const version = pattern.exec(content)?.[1];
  if (!version) {
    throw new Error(`无法读取 ${label} 版本`);
  }
  return version;
}

function localCargoLockVersion(content) {
  const packageStarts = [...content.matchAll(/^\[\[package\]\]\s*$/gm)];
  const localPackages = [];

  for (let index = 0; index < packageStarts.length; index += 1) {
    const start = packageStarts[index].index;
    const end = packageStarts[index + 1]?.index ?? content.length;
    const block = content.slice(start, end);
    if (
      /^name\s*=\s*"oss-client"\s*$/m.test(block) &&
      !/^source\s*=/m.test(block)
    ) {
      localPackages.push(block);
    }
  }

  if (localPackages.length > 1) {
    throw new Error("Cargo.lock 中存在多个本地 oss-client package");
  }
  if (localPackages.length === 0) return undefined;

  return matchVersion(
    localPackages[0],
    /^version\s*=\s*"([^"]+)"/m,
    "Cargo.lock local package",
  );
}

function releaseTag() {
  const argumentsAfterSeparator = process.argv.slice(2);
  if (argumentsAfterSeparator.length > 0) {
    if (argumentsAfterSeparator[0] === "--tag") {
      if (argumentsAfterSeparator.length !== 2 || !argumentsAfterSeparator[1]) {
        throw new Error("--tag 需要且只能接受一个非空 tag 名称");
      }
      return argumentsAfterSeparator[1];
    }

    if (
      argumentsAfterSeparator.length === 1 &&
      argumentsAfterSeparator[0].startsWith("--tag=")
    ) {
      const tag = argumentsAfterSeparator[0].slice("--tag=".length);
      if (!tag) throw new Error("--tag= 需要非空 tag 名称");
      return tag;
    }

    throw new Error(`不支持的参数：${argumentsAfterSeparator.join(" ")}`);
  }

  if (process.env.GITHUB_REF_TYPE === "tag") {
    if (!process.env.GITHUB_REF_NAME) {
      throw new Error("GITHUB_REF_TYPE=tag 时缺少 GITHUB_REF_NAME");
    }
    return process.env.GITHUB_REF_NAME;
  }

  return undefined;
}
