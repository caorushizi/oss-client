import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const projectRoot = process.cwd();
const sourceRoots = [
  join(projectRoot, "apps", "desktop", "src", "app"),
  join(projectRoot, "apps", "desktop", "src", "features"),
];

const forbiddenPatterns = [
  {
    name: "任意十六进制视觉颜色",
    expression: /(?:bg|text|border|ring|fill|stroke)-\[#[\da-fA-F]+\]/g,
  },
  {
    name: "页面级白色或黑色透明度",
    expression:
      /(?:bg|text|border|ring|divide)-(?:white|black)\/(?:\[[^\]]+\]|[\d.]+)/g,
  },
  {
    name: "页面级 foreground 临时透明度",
    expression: /text-foreground\/(?:\[[^\]]+\]|[\d.]+)/g,
  },
];

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? collectSourceFiles(path) : [path];
    }),
  );

  return files.flat().filter((path) => [".ts", ".tsx"].includes(extname(path)));
}

const files = (await Promise.all(sourceRoots.map(collectSourceFiles))).flat();
const violations = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  for (const { name, expression } of forbiddenPatterns) {
    for (const match of source.matchAll(expression)) {
      const index = match.index ?? 0;
      const line = source.slice(0, index).split("\n").length;
      violations.push({
        file: relative(projectRoot, file),
        line,
        name,
        value: match[0],
      });
    }
  }
}

if (violations.length) {
  console.error("Design System 检查失败：业务页面中存在视觉硬编码。");
  for (const violation of violations) {
    console.error(
      `- ${violation.file}:${violation.line} ${violation.name}（${violation.value}）`,
    );
  }
  process.exitCode = 1;
} else {
  console.log("Design System 检查通过。");
}
