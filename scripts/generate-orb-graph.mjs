// Node 24+: node scripts/generate-orb-graph.mjs [--check]
// The PNG supplies topology only. The application decodes the packed graph.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import {
  createOrbGraph,
  orbReference,
} from "../apps/desktop/src/components/app/scene-orb-geometry.ts";

const sourcePath = "apps/desktop/src/assets/images/global.png";
const sourceUrl = new URL(`../${sourcePath}`, import.meta.url);
const outputUrl = new URL(
  "../apps/desktop/src/components/app/scene-orb-data.json",
  import.meta.url,
);
const precision = 32;

function decodePng(png) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!png.subarray(0, 8).equals(signature))
    throw new Error("Reference asset is not a PNG.");
  let width = 0;
  let height = 0;
  let ended = false;
  const compressed = [];
  for (let offset = 8; offset < png.length;) {
    if (offset + 12 > png.length) throw new Error("Truncated PNG chunk.");
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const start = offset + 8;
    const end = start + length;
    if (end + 4 > png.length) throw new Error("Truncated PNG data.");
    if (type === "IHDR") {
      if (offset !== 8 || length !== 13) throw new Error("Invalid PNG header.");
      width = png.readUInt32BE(start);
      height = png.readUInt32BE(start + 4);
      if (
        png[start + 8] !== 8 ||
        png[start + 9] !== 6 ||
        png[start + 10] !== 0 ||
        png[start + 11] !== 0 ||
        png[start + 12] !== 0
      )
        throw new Error("Expected an 8-bit RGBA, non-interlaced PNG.");
      if (width !== orbReference.width || height !== orbReference.height)
        throw new Error("Reference dimensions differ from orbReference.");
    } else if (type === "IDAT") {
      if (!width || !height) throw new Error("PNG data precedes its header.");
      compressed.push(png.subarray(start, end));
    } else if (type === "IEND") {
      ended = true;
      break;
    }
    offset = end + 4;
  }
  if (!ended || !compressed.length) throw new Error("Incomplete PNG.");
  const stride = width * 4;
  const filtered = inflateSync(Buffer.concat(compressed));
  if (filtered.length !== (stride + 1) * height)
    throw new Error("Unexpected PNG scanline length.");
  const data = new Uint8ClampedArray(width * height * 4);
  const paeth = (left, up, upperLeft) => {
    const prediction = left + up - upperLeft;
    const leftDistance = Math.abs(prediction - left);
    const upDistance = Math.abs(prediction - up);
    const diagonalDistance = Math.abs(prediction - upperLeft);
    if (leftDistance <= upDistance && leftDistance <= diagonalDistance)
      return left;
    return upDistance <= diagonalDistance ? up : upperLeft;
  };
  for (let row = 0; row < height; row += 1) {
    const source = row * (stride + 1);
    const target = row * stride;
    const filter = filtered[source];
    if (filter > 4) throw new Error(`Unsupported PNG filter: ${filter}`);
    for (let column = 0; column < stride; column += 1) {
      const left = column >= 4 ? data[target + column - 4] : 0;
      const up = row ? data[target + column - stride] : 0;
      const upperLeft =
        row && column >= 4 ? data[target + column - stride - 4] : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      else if (filter === 2) prediction = up;
      else if (filter === 3) prediction = Math.floor((left + up) / 2);
      else if (filter === 4) prediction = paeth(left, up, upperLeft);
      data[target + column] =
        (filtered[source + column + 1] + prediction) & 255;
    }
  }
  return { width, height, data };
}

const source = await readFile(sourceUrl);
const graph = createOrbGraph(decodePng(source));
const nodeCount = graph.strengths.length;
const edgeCount = graph.edges.length / 2;
if (nodeCount > 65535)
  throw new Error("Orb graph exceeds 16-bit node indices.");
const nodes = Buffer.alloc(nodeCount * 5);
const edges = Buffer.alloc(edgeCount * 5);
for (let node = 0; node < nodeCount; node += 1) {
  const sourceX =
    orbReference.centerX + graph.positions[node * 3] * orbReference.radius;
  const sourceY =
    orbReference.centerY - graph.positions[node * 3 + 1] * orbReference.radius;
  nodes.writeUInt16LE(Math.round(sourceX * precision), node * 5);
  nodes.writeUInt16LE(Math.round(sourceY * precision), node * 5 + 2);
  nodes[node * 5 + 4] = Math.round(graph.strengths[node] * 255);
}
for (let edge = 0; edge < edgeCount; edge += 1) {
  edges.writeUInt16LE(graph.edges[edge * 2], edge * 5);
  edges.writeUInt16LE(graph.edges[edge * 2 + 1], edge * 5 + 2);
  edges[edge * 5 + 4] = Math.round(graph.edgeStrengths[edge] * 255);
}
const packed = {
  version: 1,
  source: sourcePath,
  sourceSha256: createHash("sha256").update(source).digest("hex"),
  coordinatePrecision: precision,
  nodeCount,
  edgeCount,
  nodes: nodes.toString("base64"),
  edges: edges.toString("base64"),
};
const output = `${JSON.stringify(packed, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if ((await readFile(outputUrl, "utf8")) !== output)
    throw new Error(
      "Packed orb graph is stale; run node scripts/generate-orb-graph.mjs.",
    );
  console.log(`Orb graph is current: ${nodeCount} nodes, ${edgeCount} edges.`);
} else {
  await writeFile(outputUrl, output);
  console.log(
    `Generated orb graph: ${nodeCount} nodes, ${edgeCount} edges, ${nodes.length + edges.length} packed bytes.`,
  );
}
