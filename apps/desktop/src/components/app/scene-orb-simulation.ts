import type { OrbGraph } from "./scene-orb-geometry";

export const ORB_NODE_ATTACHED = 0;
export const ORB_NODE_DETACHING = 1;
export const ORB_NODE_FREE = 2;
export const ORB_NODE_FADED = 3;
export const ORB_NODE_REJOINING = 4;

const DETACH_DURATION = 1.05;
const HIDDEN_DURATION = 0.45;
const REJOIN_DURATION = 1.8;
const FIRST_RELEASE = 3;
const RELEASE_SPACING = 1.65;

function smoothstep(start: number, end: number, value: number) {
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

function random(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

/**
 * One node index survives attachment, release and rejoining. The point cloud
 * and all its incident lines read the same position; there is no emitter pool.
 * Surface motion is an analytic, connected wind field constrained to radius 1.
 */
export function createOrbSimulation(graph: OrbGraph) {
  const count = graph.positions.length / 3;
  const edgeCount = graph.edges.length / 2;
  const baseline = graph.positions.slice();
  const positions = baseline.slice();
  const opacities = new Float32Array(count);
  const states = new Uint8Array(count);
  const edgePositions = new Float32Array(edgeCount * 6);
  const edgeOpacities = new Float32Array(edgeCount * 2);
  const edgeVisibility = new Float32Array(count);
  const neighborTraction = new Float32Array(count);
  const amplitudes = new Float32Array(count);
  const localSpacing = new Float32Array(count);
  const releaseTimes = new Float32Array(count).fill(Infinity);
  const flightDurations = new Float32Array(count);
  const windSpeeds = new Float32Array(count);
  const windLifts = new Float32Array(count);
  const windDepths = new Float32Array(count);
  const edgeLengths = new Float32Array(edgeCount);
  const neighbors: number[][] = Array.from({ length: count }, () => []);
  const coefficients = new Float32Array(count * 3);
  const smoothedCoefficients = new Float32Array(count * 3);
  let maximumStrength = 0;

  for (let edge = 0; edge < edgeCount; edge += 1) {
    const nodeA = graph.edges[edge * 2];
    const nodeB = graph.edges[edge * 2 + 1];
    const a = nodeA * 3;
    const b = nodeB * 3;
    neighbors[nodeA].push(nodeB);
    neighbors[nodeB].push(nodeA);
    edgeLengths[edge] = Math.hypot(
      baseline[a] - baseline[b],
      baseline[a + 1] - baseline[b + 1],
      baseline[a + 2] - baseline[b + 2],
    );
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
    const spacing = distances[Math.floor(distances.length / 2)] ?? 0.045;
    localSpacing[index] = spacing;
    // Path-control vertices subdivide a cell into several tiny edges. Estimate
    // the visible cell from two connected hops, not that arbitrary subdivision.
    const cellNeighbors = new Set(neighbors[index]);
    for (const neighbor of neighbors[index]) {
      for (const next of neighbors[neighbor]) {
        if (next !== index) cellNeighbors.add(next);
      }
    }
    const cellDistances = Array.from(cellNeighbors, (neighbor) =>
      Math.hypot(
        baseline[offset] - baseline[neighbor * 3],
        baseline[offset + 1] - baseline[neighbor * 3 + 1],
      ),
    ).sort((a, b) => a - b);
    const cellSpacing =
      cellDistances[Math.floor(cellDistances.length * 0.75)] ?? spacing;
    amplitudes[index] = Math.max(0.0045, Math.min(0.021, cellSpacing * 0.22));
    maximumStrength = Math.max(maximumStrength, graph.strengths[index]);
    const seed = graph.seeds[index] * 71.39 + index * 0.731;
    for (let axis = 0; axis < 3; axis += 1) {
      coefficients[offset + axis] = random(seed + axis + 1) * 2 - 1;
    }
    flightDurations[index] = 5.2 + random(seed + 4) * 0.8;
    windSpeeds[index] = 0.115 + random(seed + 5) * 0.035;
    windLifts[index] = (random(seed + 6) - 0.5) * 0.025;
    windDepths[index] = (random(seed + 7) - 0.5) * 0.02;
  }

  // Share local eddy coefficients across actual connections, rather than
  // assigning every node an unrelated orbit. This is done only at construction.
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < count; index += 1) {
      const adjacent = neighbors[index];
      for (let axis = 0; axis < 3; axis += 1) {
        let sum = coefficients[index * 3 + axis] * 2;
        for (const neighbor of adjacent)
          sum += coefficients[neighbor * 3 + axis];
        smoothedCoefficients[index * 3 + axis] = sum / (adjacent.length + 2);
      }
    }
    coefficients.set(smoothedCoefficients);
  }

  // Smooth the displacement budget as well as the field: a bright junction and
  // its quiet curve-control vertices should move as one connected neighborhood.
  const smoothedAmplitudes = new Float32Array(count);
  for (let pass = 0; pass < 2; pass += 1) {
    for (let index = 0; index < count; index += 1) {
      let amplitude = amplitudes[index] * 2;
      for (const neighbor of neighbors[index])
        amplitude += amplitudes[neighbor];
      smoothedAmplitudes[index] = amplitude / (neighbors[index].length + 2);
    }
    amplitudes.set(smoothedAmplitudes);
  }

  // Find the actual ragged left boundary at each height. A negative X alone
  // would also release ordinary face nodes and punch artificial holes in it.
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

  // Order doubles as the preview's tracking list: the clearest connected edge
  // node leaves at 3 s, and sparse, separated releases follow it. Shared slots
  // cap the population in flight, even after a long-running animation loops.
  const trackingCandidates: number[] = [];
  for (const candidate of boundary) {
    const offset = candidate.index * 3;
    if (
      trackingCandidates.some(
        (selected) =>
          Math.hypot(
            baseline[selected * 3] - baseline[offset],
            baseline[selected * 3 + 1] - baseline[offset + 1],
          ) < 0.07,
      )
    )
      continue;
    trackingCandidates.push(candidate.index);
    if (trackingCandidates.length >= 24) break;
  }
  const period = Math.max(18, trackingCandidates.length * RELEASE_SPACING);
  const releaseSpacing = period / Math.max(1, trackingCandidates.length);
  for (let order = 0; order < trackingCandidates.length; order += 1) {
    releaseTimes[trackingCandidates[order]] =
      FIRST_RELEASE + order * releaseSpacing;
  }

  function writeSurfacePosition(index: number, time: number, wind: boolean) {
    const offset = index * 3;
    const x = baseline[offset];
    const y = baseline[offset + 1];
    const z = baseline[offset + 2];
    const amplitude = amplitudes[index] * smoothstep(0, 1.8, time);
    const fieldTime = time * 1.3;
    // Positive time and X phases carry disturbances toward decreasing X.
    // Multiple wavelengths and graph-correlated eddies stretch adjacent cells
    // without moving the entire sphere as one oscillating membrane.
    const waveA = Math.sin(fieldTime * 1.13 + x * 4.2 + y * 1.7 + z * 2.1);
    const waveB = Math.sin(fieldTime * 1.79 + x * 8.3 - y * 4.6 + z * 1.3);
    const waveC = Math.sin(fieldTime * 0.83 + x * 5.1 + y * 6.2 - z * 2.8);
    const eddy = Math.sin(
      fieldTime * 2.17 + coefficients[offset] * 2.8 + y * 7.4,
    );
    const dx =
      amplitude *
      (wind
        ? -(0.85 + waveA * 0.38 + waveB * 0.22)
        : waveA * 0.26 + waveB * 0.14);
    const dy =
      amplitude *
      (waveB * 0.34 + waveC * 0.23 + eddy * coefficients[offset + 1] * 0.48);
    const dz =
      amplitude *
      (waveC * 0.23 + waveA * 0.13 + eddy * coefficients[offset + 2] * 0.38);
    const radialDisplacement = x * dx + y * dy + z * dz;
    const movedX = x + dx - x * radialDisplacement;
    const movedY = y + dy - y * radialDisplacement;
    const movedZ = z + dz - z * radialDisplacement;
    const inverseLength = 1 / Math.hypot(movedX, movedY, movedZ);
    positions[offset] = movedX * inverseLength;
    positions[offset + 1] = movedY * inverseLength;
    positions[offset + 2] = movedZ * inverseLength;
  }

  function update(time: number, motion: boolean, wind = true) {
    const seconds = Number.isFinite(time) ? Math.max(0, time) : 0;

    if (!motion) {
      positions.set(baseline);
      opacities.fill(1);
      edgeVisibility.fill(1);
      states.fill(ORB_NODE_ATTACHED);
    } else {
      for (let index = 0; index < count; index += 1) {
        const elapsed = seconds - releaseTimes[index];
        const age = elapsed >= 0 ? elapsed % period : -1;
        const flightDuration = flightDurations[index];
        const rejoinStart = flightDuration + HIDDEN_DURATION;
        const rejoinEnd = rejoinStart + REJOIN_DURATION;
        opacities[index] = 1;
        edgeVisibility[index] = 1;
        states[index] = ORB_NODE_ATTACHED;

        if (!wind || age < 0 || age >= rejoinEnd) {
          writeSurfacePosition(index, seconds, wind);
          continue;
        }

        if (age < flightDuration) {
          // Evaluate this same node's launch pose analytically. Acceleration
          // starts at zero while its incident edges are still pulling on it.
          writeSurfacePosition(index, seconds - age, wind);
          const offset = index * 3;
          const acceleration = age - 0.65 * (1 - Math.exp(-age / 0.65));
          positions[offset] -= windSpeeds[index] * acceleration;
          positions[offset + 1] += windLifts[index] * acceleration;
          positions[offset + 2] += windDepths[index] * acceleration;
          opacities[index] =
            1 - smoothstep(flightDuration - 1.7, flightDuration, age);
          edgeVisibility[index] = 1 - smoothstep(0.22, DETACH_DURATION, age);
          states[index] =
            age < DETACH_DURATION ? ORB_NODE_DETACHING : ORB_NODE_FREE;
          continue;
        }

        // Teleport only at zero opacity, then quietly restore the same ID.
        writeSurfacePosition(index, seconds, wind);
        if (age < rejoinStart) {
          opacities[index] = 0;
          edgeVisibility[index] = 0;
          states[index] = ORB_NODE_FADED;
        } else {
          opacities[index] = smoothstep(rejoinStart, rejoinEnd, age);
          edgeVisibility[index] = opacities[index];
          states[index] = ORB_NODE_REJOINING;
        }
      }
    }

    if (motion && wind) {
      neighborTraction.fill(0);
      for (const source of trackingCandidates) {
        if (states[source] !== ORB_NODE_DETACHING) continue;
        const age = (seconds - releaseTimes[source]) % period;
        const pull =
          smoothstep(0, 0.3, age) * (1 - smoothstep(0.5, DETACH_DURATION, age));
        for (const neighbor of neighbors[source]) {
          if (states[neighbor] === ORB_NODE_ATTACHED) {
            neighborTraction[neighbor] += pull;
          }
        }
      }
      // An outgoing junction tugs its actual immediate neighbors, then releases
      // them as its edges break. Keep this small, local and tangent to the shell.
      for (let index = 0; index < count; index += 1) {
        const influence = neighborTraction[index];
        if (!influence) continue;
        const offset = index * 3;
        const x = positions[offset];
        const y = positions[offset + 1];
        const z = positions[offset + 2];
        const pull =
          Math.min(1, influence) * Math.min(0.01, localSpacing[index] * 0.22);
        const movedX = x - pull * (1 - x * x);
        const movedY = y + pull * x * y;
        const movedZ = z + pull * x * z;
        const inverseLength = 1 / Math.hypot(movedX, movedY, movedZ);
        positions[offset] = movedX * inverseLength;
        positions[offset + 1] = movedY * inverseLength;
        positions[offset + 2] = movedZ * inverseLength;
      }
    }

    for (let edge = 0; edge < edgeCount; edge += 1) {
      const nodeA = graph.edges[edge * 2];
      const nodeB = graph.edges[edge * 2 + 1];
      const a = nodeA * 3;
      const b = nodeB * 3;
      const offset = edge * 6;
      edgePositions[offset] = positions[a];
      edgePositions[offset + 1] = positions[a + 1];
      edgePositions[offset + 2] = positions[a + 2];
      edgePositions[offset + 3] = positions[b];
      edgePositions[offset + 4] = positions[b + 1];
      edgePositions[offset + 5] = positions[b + 2];

      const length = Math.hypot(
        positions[a] - positions[b],
        positions[a + 1] - positions[b + 1],
        positions[a + 2] - positions[b + 2],
      );
      const originalLength = edgeLengths[edge];
      const distanceFade =
        1 -
        smoothstep(
          originalLength * 1.55 + 0.012,
          originalLength * 2.3 + 0.025,
          length,
        );
      const visibility =
        Math.min(edgeVisibility[nodeA], edgeVisibility[nodeB]) * distanceFade;
      edgeOpacities[edge * 2] = visibility;
      edgeOpacities[edge * 2 + 1] = visibility;
    }
  }

  update(0, false);
  return {
    positions,
    opacities,
    edgePositions,
    edgeOpacities,
    states,
    trackingCandidates,
    update,
  };
}
