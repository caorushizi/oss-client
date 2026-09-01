import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bump = bumpArgument();
const releaseFiles = {
  rootPackage: "package.json",
  desktopPackage: "apps/desktop/package.json",
  tauriConfig: "apps/desktop/src-tauri/tauri.conf.json",
  cargoManifest: "apps/desktop/src-tauri/Cargo.toml",
  cargoLock: "apps/desktop/src-tauri/Cargo.lock",
  sidecarMain: "services/oss-sidecar/cmd/oss-sidecar/main.go",
};
const contents = new Map(
  Object.values(releaseFiles).map((path) => [path, readText(path)]),
);
const versions = new Map([
  [
    releaseFiles.rootPackage,
    jsonVersion(contents.get(releaseFiles.rootPackage), "root package"),
  ],
  [
    releaseFiles.desktopPackage,
    jsonVersion(contents.get(releaseFiles.desktopPackage), "desktop package"),
  ],
  [
    releaseFiles.tauriConfig,
    jsonVersion(contents.get(releaseFiles.tauriConfig), "Tauri config"),
  ],
  [
    releaseFiles.cargoManifest,
    matchVersion(
      contents.get(releaseFiles.cargoManifest),
      /^(version\s*=\s*")([^"]+)(")/m,
      "Cargo package",
    ),
  ],
  [
    releaseFiles.sidecarMain,
    matchVersion(
      contents.get(releaseFiles.sidecarMain),
      /^(\s*version\s*=\s*")([^"]+)(")/m,
      "Go sidecar",
    ),
  ],
]);
const cargoLockPackage = localCargoLockPackage(
  contents.get(releaseFiles.cargoLock),
);
if (cargoLockPackage !== undefined) {
  versions.set(releaseFiles.cargoLock, cargoLockPackage.version);
}

const currentVersion = versions.get(releaseFiles.rootPackage);
const mismatches = [...versions].filter(
  ([, version]) => version !== currentVersion,
);
if (mismatches.length > 0) {
  throw new Error(
    `发布版本不一致，期望 ${currentVersion}：${mismatches
      .map(([path, version]) => `${path}=${version}`)
      .join(", ")}`,
  );
}

const stableVersionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const currentMatch = stableVersionPattern.exec(currentVersion);
if (!currentMatch) {
  throw new Error(`只能 bump 稳定 SemVer，当前版本为 ${currentVersion}`);
}

const parts = currentMatch.slice(1).map((part) => BigInt(part));
if (bump === "patch") {
  parts[2] += 1n;
} else if (bump === "minor") {
  parts[1] += 1n;
  parts[2] = 0n;
} else {
  parts[0] += 1n;
  parts[1] = 0n;
  parts[2] = 0n;
}

const nextVersion = parts.join(".");
const releaseTag = `v${nextVersion}`;
const updates = new Map([
  [
    releaseFiles.rootPackage,
    replaceVersion(
      contents.get(releaseFiles.rootPackage),
      /("version"\s*:\s*")([^"]+)(")/,
      currentVersion,
      nextVersion,
      "root package",
    ),
  ],
  [
    releaseFiles.desktopPackage,
    replaceVersion(
      contents.get(releaseFiles.desktopPackage),
      /("version"\s*:\s*")([^"]+)(")/,
      currentVersion,
      nextVersion,
      "desktop package",
    ),
  ],
  [
    releaseFiles.tauriConfig,
    replaceVersion(
      contents.get(releaseFiles.tauriConfig),
      /("version"\s*:\s*")([^"]+)(")/,
      currentVersion,
      nextVersion,
      "Tauri config",
    ),
  ],
  [
    releaseFiles.cargoManifest,
    replaceVersion(
      contents.get(releaseFiles.cargoManifest),
      /^(version\s*=\s*")([^"]+)(")/m,
      currentVersion,
      nextVersion,
      "Cargo package",
    ),
  ],
  [
    releaseFiles.sidecarMain,
    replaceVersion(
      contents.get(releaseFiles.sidecarMain),
      /^(\s*version\s*=\s*")([^"]+)(")/m,
      currentVersion,
      nextVersion,
      "Go sidecar",
    ),
  ],
]);
if (cargoLockPackage !== undefined) {
  const cargoLock = contents.get(releaseFiles.cargoLock);
  updates.set(
    releaseFiles.cargoLock,
    `${cargoLock.slice(0, cargoLockPackage.versionStart)}${nextVersion}${cargoLock.slice(
      cargoLockPackage.versionEnd,
    )}`,
  );
}

try {
  for (const [path, content] of updates) {
    writeFileSync(resolve(workspaceRoot, path), content, "utf8");
  }
  execFileSync(
    process.execPath,
    [
      resolve(workspaceRoot, "scripts/check-release-version.mjs"),
      "--tag",
      releaseTag,
    ],
    { cwd: workspaceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
} catch (error) {
  for (const [path, content] of contents) {
    writeFileSync(resolve(workspaceRoot, path), content, "utf8");
  }
  throw error;
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${nextVersion}\ntag=${releaseTag}\n`,
    "utf8",
  );
}
console.log(`version=${nextVersion}`);
console.log(`tag=${releaseTag}`);

function bumpArgument() {
  const args = process.argv.slice(2);
  let value;
  if (args.length === 2 && args[0] === "--bump") {
    value = args[1];
  } else if (args.length === 1 && args[0].startsWith("--bump=")) {
    value = args[0].slice("--bump=".length);
  } else {
    throw new Error("用法：--bump patch|minor|major");
  }
  if (!new Set(["patch", "minor", "major"]).has(value)) {
    throw new Error(`不支持的 bump 类型：${value || "空值"}`);
  }
  return value;
}

function readText(path) {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

function jsonVersion(content, label) {
  return matchVersion(content, /("version"\s*:\s*")([^"]+)(")/, label);
}

function matchVersion(content, pattern, label) {
  const version = pattern.exec(content)?.[2];
  if (!version) throw new Error(`无法读取 ${label} 版本`);
  return version;
}

function replaceVersion(content, pattern, expected, replacement, label) {
  const match = pattern.exec(content);
  if (!match) throw new Error(`无法定位 ${label} 版本`);
  if (match[2] !== expected) {
    throw new Error(`${label} 版本为 ${match[2]}，期望 ${expected}`);
  }
  return `${content.slice(0, match.index)}${match[1]}${replacement}${match[3]}${content.slice(match.index + match[0].length)}`;
}

function localCargoLockPackage(content) {
  const packageStarts = [...content.matchAll(/^\[\[package\]\]\s*$/gm)];
  const matches = [];

  for (let index = 0; index < packageStarts.length; index += 1) {
    const start = packageStarts[index].index;
    const end = packageStarts[index + 1]?.index ?? content.length;
    const block = content.slice(start, end);
    if (
      /^name\s*=\s*"oss-client"\s*$/m.test(block) &&
      !/^source\s*=/m.test(block)
    ) {
      const versionMatch = /^version\s*=\s*"([^"]+)"/m.exec(block);
      if (!versionMatch) {
        throw new Error("Cargo.lock 本地 oss-client package 缺少版本");
      }
      const valueOffset = versionMatch[0].indexOf(versionMatch[1]);
      matches.push({
        version: versionMatch[1],
        versionStart: start + versionMatch.index + valueOffset,
        versionEnd:
          start + versionMatch.index + valueOffset + versionMatch[1].length,
      });
    }
  }

  if (matches.length > 1) {
    throw new Error("Cargo.lock 中存在多个本地 oss-client package");
  }
  return matches[0];
}
