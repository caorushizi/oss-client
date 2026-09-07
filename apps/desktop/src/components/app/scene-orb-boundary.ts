import type { OrbGraph } from "./scene-orb-geometry";

const boundaryCache = new WeakMap<OrbGraph, readonly number[]>();

// Boundary selection depends only on the immutable graph, not its animation.
// Keep its original spacing and score so the same source nodes leave the shell.
export function selectOrbBoundaryNodes(graph: OrbGraph): readonly number[] {
  const cached = boundaryCache.get(graph);
  if (cached) return cached;

  const baseline = graph.positions;
  const count = baseline.length / 3;
  const neighbors: number[][] = Array.from({ length: count }, () => []);
  const localSpacing = new Float32Array(count);
  let maximumStrength = 0;
  for (let edge = 0; edge < graph.edges.length; edge += 2) {
    const a = graph.edges[edge];
    const b = graph.edges[edge + 1];
    neighbors[a].push(b);
    neighbors[b].push(a);
  }
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const distances = neighbors[index]
      .map((neighbor) =>
        Math.hypot(
          baseline[offset] - baseline[neighbor * 3],
          baseline[offset + 1] - baseline[neighbor * 3 + 1],
        ),
      )
      .sort((a, b) => a - b);
    localSpacing[index] = distances[Math.floor(distances.length / 2)] ?? 0.045;
    maximumStrength = Math.max(maximumStrength, graph.strengths[index]);
  }

  const boundary: { index: number; score: number }[] = [];
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const x = baseline[offset];
    const y = baseline[offset + 1];
    const adjacent = neighbors[index];
    if (
      x > -0.24 ||
      adjacent.length < 2 ||
      graph.strengths[index] < maximumStrength * 0.25
    )
      continue;

    const verticalBand = Math.max(0.055, localSpacing[index] * 0.85);
    let leftmostX = x;
    for (let other = 0; other < count; other += 1) {
      if (
        graph.strengths[other] >= maximumStrength * 0.1 &&
        neighbors[other].length >= 2 &&
        Math.abs(baseline[other * 3 + 1] - y) < verticalBand
      ) {
        leftmostX = Math.min(leftmostX, baseline[other * 3]);
      }
    }
    if (x - leftmostX > Math.max(0.04, localSpacing[index] * 0.9)) continue;

    let supportOnRight = 0;
    for (const neighbor of adjacent) {
      const dx = baseline[neighbor * 3] - x;
      const dy = baseline[neighbor * 3 + 1] - y;
      supportOnRight += dx / Math.max(0.00001, Math.hypot(dx, dy));
    }
    supportOnRight /= adjacent.length;
    if (supportOnRight < 0.02) continue;
    boundary.push({
      index,
      score:
        supportOnRight * 0.9 +
        graph.strengths[index] * 0.65 +
        (1 - Math.abs(y)) * 0.65 -
        adjacent.length * 0.025,
    });
  }
  boundary.sort((a, b) => b.score - a.score);

  const selected: number[] = [];
  for (const candidate of boundary) {
    const offset = candidate.index * 3;
    if (
      selected.some(
        (index) =>
          Math.hypot(
            baseline[index * 3] - baseline[offset],
            baseline[index * 3 + 1] - baseline[offset + 1],
          ) < 0.07,
      )
    )
      continue;
    selected.push(candidate.index);
    if (selected.length >= 12) break;
  }
  boundaryCache.set(graph, selected);
  return selected;
}
