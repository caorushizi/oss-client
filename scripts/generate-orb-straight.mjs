// Node 24+: node scripts/generate-orb-straight.mjs [--check]
// Source-bright junctions connected only when a straight chord follows a
// continuous ridge in the reference. No skeleton bends become extra nodes.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { orbReference } from "../apps/desktop/src/components/app/scene-orb-geometry.ts";

const sourcePath = "apps/desktop/src/assets/images/global.png";
const sourceUrl = new URL(`../${sourcePath}`, import.meta.url);
const outputUrl = new URL(
  "../apps/desktop/src/components/app/scene-orb-straight.json",
  import.meta.url,
);
const candidatesUrl = new URL(
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
const image = decodePng(source);
const reference = JSON.parse(await readFile(candidatesUrl, "utf8"));
const sourceSha256 = createHash("sha256").update(source).digest("hex");
if (
  reference.version !== 1 ||
  reference.coordinatePrecision !== precision ||
  reference.sourceSha256 !== sourceSha256
)
  throw new Error(
    "Source junction candidates are stale; regenerate scene-orb-data.json first.",
  );
const packedCandidates = Buffer.from(reference.nodes, "base64");
const alpha = new Float32Array(image.width * image.height);
for (let pixel = 0; pixel < alpha.length; pixel += 1)
  alpha[pixel] = image.data[pixel * 4 + 3];

function sample(x, y) {
  const left = Math.floor(x);
  const top = Math.floor(y);
  if (left < 0 || top < 0 || left >= image.width - 1 || top >= image.height - 1)
    return 0;
  const tx = x - left;
  const ty = y - top;
  const offset = top * image.width + left;
  return (
    alpha[offset] * (1 - tx) * (1 - ty) +
    alpha[offset + 1] * tx * (1 - ty) +
    alpha[offset + image.width] * (1 - tx) * ty +
    alpha[offset + image.width + 1] * tx * ty
  );
}

// Recover locations of the original beads, not every crossing produced by
// thinning the raster. Suppress duplicate samples inside the same bright core.
const candidates = [];
for (let index = 0; index < reference.nodeCount; index += 1) {
  const strength = packedCandidates[index * 5 + 4] / 255;
  if (strength < 0.36) continue;
  const x = packedCandidates.readUInt16LE(index * 5) / precision;
  const y = packedCandidates.readUInt16LE(index * 5 + 2) / precision;
  const radius = Math.hypot(x - orbReference.centerX, y - orbReference.centerY);
  if (radius > orbReference.radius * 0.995) continue;
  candidates.push({ x, y, strength, radius });
}
candidates.sort((a, b) => b.strength - a.strength || a.y - b.y || a.x - b.x);
const nodes = [];
for (const candidate of candidates) {
  if (
    nodes.some(
      (node) => Math.hypot(candidate.x - node.x, candidate.y - node.y) < 2.8,
    )
  )
    continue;
  nodes.push(candidate);
}
nodes.sort((a, b) => a.y - b.y || a.x - b.x);

const edges = [];
let tested = 0;
for (let a = 0; a < nodes.length; a += 1) {
  const first = nodes[a];
  for (let b = a + 1; b < nodes.length; b += 1) {
    const second = nodes[b];
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const length = Math.hypot(dx, dy);
    if (length < 5 || length > 110) continue;
    const nx = -dy / length;
    const ny = dx / length;
    const steps = Math.max(5, Math.ceil(length / 1.2));
    let energy = 0;
    let ridgeEnergy = 0;
    let supported = 0;
    let gap = 0;
    let largestGap = 0;
    let samples = 0;
    tested += 1;
    for (let step = 0; step < steps; step += 1) {
      // Bright endpoint cores must not make an unsupported chord pass.
      const along = 2 + ((length - 4) * (step + 0.5)) / steps;
      const x = first.x + (dx * along) / length;
      const y = first.y + (dy * along) / length;
      const center = Math.max(
        sample(x, y),
        sample(x + nx * 0.4, y + ny * 0.4),
        sample(x - nx * 0.4, y - ny * 0.4),
      );
      const sides =
        (sample(x + nx * 1.8, y + ny * 1.8) +
          sample(x - nx * 1.8, y - ny * 1.8)) *
        0.5;
      const contrast = center - sides;
      energy += center;
      ridgeEnergy += contrast;
      samples += 1;
      if (contrast >= 0.75 && center >= 2.5) {
        supported += 1;
        gap = 0;
      } else {
        gap += 1;
        largestGap = Math.max(largestGap, gap);
      }
    }
    const agreement = supported / samples;
    const ridge = ridgeEnergy / samples;
    if (
      agreement < 0.8 ||
      ridge < 1.75 ||
      (largestGap * (length - 4)) / steps > Math.max(3.5, length * 0.12)
    )
      continue;
    edges.push({
      a,
      b,
      strength: Math.min(1, (energy / samples / 77) * (0.7 + agreement * 0.3)),
      length,
      agreement,
      ridge,
    });
  }
}

// An intermediate bright bead is a real shared endpoint. Do not draw another
// full-length line directly over the two supported segments passing through it.
const adjacency = Array.from({ length: nodes.length }, () => new Set());
edges.sort((a, b) => a.length - b.length);
const selected = [];
for (const edge of edges) {
  const first = nodes[edge.a];
  const second = nodes[edge.b];
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const split = [...adjacency[edge.a]].some((middle) => {
    if (!adjacency[edge.b].has(middle)) return false;
    const px = nodes[middle].x - first.x;
    const py = nodes[middle].y - first.y;
    const along = (px * dx + py * dy) / (edge.length * edge.length);
    return (
      along > 0.08 &&
      along < 0.92 &&
      Math.abs(px * dy - py * dx) / edge.length < 1.2
    );
  });
  if (split) continue;
  adjacency[edge.a].add(edge.b);
  adjacency[edge.b].add(edge.a);
  selected.push(edge);
}

// Every tested chord sees the complete source brightness, including nearby
// overlapping threads. Allocate that shared light once, rather than giving
// every crossing the full brightness and turning the dense rim into a band.
const predicted = new Float32Array(alpha.length);
function samplePrediction(x, y) {
  const left = Math.floor(x);
  const top = Math.floor(y);
  const tx = x - left;
  const ty = y - top;
  const offset = top * image.width + left;
  return (
    predicted[offset] * (1 - tx) * (1 - ty) +
    predicted[offset + 1] * tx * (1 - ty) +
    predicted[offset + image.width] * (1 - tx) * ty +
    predicted[offset + image.width + 1] * tx * ty
  );
}
function accumulateLight(edge) {
  const first = nodes[edge.a];
  const second = nodes[edge.b];
  const dx = second.x - first.x;
  const dy = second.y - first.y;
  const squaredLength = edge.length * edge.length;
  const left = Math.max(0, Math.floor(Math.min(first.x, second.x) - 3));
  const right = Math.min(
    image.width - 1,
    Math.ceil(Math.max(first.x, second.x) + 3),
  );
  const top = Math.max(0, Math.floor(Math.min(first.y, second.y) - 3));
  const bottom = Math.min(
    image.height - 1,
    Math.ceil(Math.max(first.y, second.y) + 3),
  );
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const px = x - first.x;
      const py = y - first.y;
      const along = Math.max(
        0,
        Math.min(1, (px * dx + py * dy) / squaredLength),
      );
      const distanceSquared = (px - dx * along) ** 2 + (py - dy * along) ** 2;
      if (distanceSquared > 9) continue;
      predicted[y * image.width + x] +=
        edge.strength *
        0.34 *
        (Math.exp(-distanceSquared / 0.29) +
          Math.exp(-distanceSquared / 2.5) * 0.065);
    }
  }
}
const sourceEnergy = selected.reduce(
  (sum, edge) => sum + edge.strength * edge.length,
  0,
);
for (let pass = 0; pass < 4; pass += 1) {
  predicted.fill(0);
  for (const edge of selected) accumulateLight(edge);
  for (const edge of selected) {
    const first = nodes[edge.a];
    const second = nodes[edge.b];
    const steps = Math.max(3, Math.ceil((edge.length - 4) / 1.5));
    let ratio = 0;
    for (let step = 0; step < steps; step += 1) {
      const along =
        (2 + ((edge.length - 4) * (step + 0.5)) / steps) / edge.length;
      const x = first.x + (second.x - first.x) * along;
      const y = first.y + (second.y - first.y) * along;
      ratio += Math.max(
        0.025,
        Math.min(
          1.35,
          sample(x, y) / 255 / Math.max(0.00001, samplePrediction(x, y)),
        ),
      );
    }
    edge.strength *= 0.25 + (ratio / steps) * 0.75;
  }
}

const connected = nodes.map((_, index) => adjacency[index].size > 0);
const remap = new Uint16Array(nodes.length);
let nextNode = 0;
const retained = nodes.filter((_, index) => {
  if (!connected[index]) return false;
  remap[index] = nextNode;
  nextNode += 1;
  return true;
});
if (retained.length > 65535)
  throw new Error("Straight orb graph exceeds 16-bit node indices.");
const packedNodes = Buffer.alloc(retained.length * 5);
const packedEdges = Buffer.alloc(selected.length * 5);
retained.forEach((node, index) => {
  packedNodes.writeUInt16LE(Math.round(node.x * precision), index * 5);
  packedNodes.writeUInt16LE(Math.round(node.y * precision), index * 5 + 2);
  packedNodes[index * 5 + 4] = Math.round(node.strength * 255);
});
selected.forEach((edge, index) => {
  packedEdges.writeUInt16LE(remap[edge.a], index * 5);
  packedEdges.writeUInt16LE(remap[edge.b], index * 5 + 2);
  // Square-root encoding retains the many faint threads in the dense rim.
  packedEdges[index * 5 + 4] = Math.round(
    Math.sqrt(Math.min(1, edge.strength)) * 255,
  );
});
const packed = {
  version: 1,
  source: sourcePath,
  sourceSha256,
  coordinatePrecision: precision,
  nodeCount: retained.length,
  edgeCount: selected.length,
  edgeStrengthEncoding: "sqrt",
  nodes: packedNodes.toString("base64"),
  edges: packedEdges.toString("base64"),
};
const output = `${JSON.stringify(packed, null, 2)}\n`;
if (process.argv.includes("--check")) {
  if ((await readFile(outputUrl, "utf8")) !== output)
    throw new Error(
      "Packed straight orb graph is stale; run node scripts/generate-orb-straight.mjs.",
    );
} else {
  await writeFile(outputUrl, output);
}
const lengths = selected.map((edge) => edge.length).sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      nodes: retained.length,
      edges: selected.length,
      candidates: nodes.length,
      tested,
      sourceValidated: edges.length,
      meanAgreement:
        selected.reduce((sum, edge) => sum + edge.agreement, 0) /
        selected.length,
      lengthMedian: lengths[Math.floor(lengths.length / 2)],
      lengthP90: lengths[Math.floor(lengths.length * 0.9)],
      faceEdges: selected.filter(
        (edge) => (nodes[edge.a].radius + nodes[edge.b].radius) * 0.5 < 190,
      ).length,
      rimEdges: selected.filter(
        (edge) => (nodes[edge.a].radius + nodes[edge.b].radius) * 0.5 >= 190,
      ).length,
      normalizedEnergy:
        selected.reduce((sum, edge) => sum + edge.strength * edge.length, 0) /
        sourceEnergy,
    },
    null,
    2,
  ),
);
