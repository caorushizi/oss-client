import type { OrbGraph } from "./scene-orb-geometry";
import { selectOrbBoundaryNodes } from "./scene-orb-boundary";
import {
  ORB_NODE_ATTACHED,
  ORB_NODE_DETACHING,
  ORB_NODE_FADED,
  ORB_NODE_FREE,
  ORB_NODE_REJOINING,
} from "./scene-orb-simulation";

const FIRST_RELEASE = 3;
const RELEASE_SPACING = 1.8;
const FLIGHT_DURATION = 5;
const HIDDEN_DURATION = 0.4;
const REJOIN_DURATION = 1.8;
const CUT_COUNT = 12;

function smoothstep(start: number, end: number, value: number) {
  const amount = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return amount * amount * (3 - 2 * amount);
}

/**
 * The nodes follow a small tangential flow. Straight connections read these
 * same endpoint positions; no displacement is applied along their length.
 * Every point stays on the shell; the outer silhouette is stationary.
 */
export function writeOrbSurface(
  out: Float32Array,
  offset: number,
  x: number,
  y: number,
  z: number,
  time: number,
  motion: boolean,
  wind: boolean,
) {
  const radiusXY = Math.hypot(x, y);
  if (!motion || time <= 0 || radiusXY >= 1) {
    out[offset] = x;
    out[offset + 1] = y;
    out[offset + 2] = z;
    return;
  }

  const rim = 1 - smoothstep(0.88, 1, radiusXY);
  const phaseA = x * 13.7 + y * 7.1 + z * 2.3;
  const phaseB = x * 21.3 - y * 11.7 + z * 3.1;
  const phaseC = x * 10.9 + y * 18.1 - z * 4.7;
  const waveA = Math.sin(phaseA + time * 0.78) - Math.sin(phaseA);
  const waveB = Math.sin(phaseB + time * 1.07) - Math.sin(phaseB);
  const waveC = Math.sin(phaseC + time * 0.61) - Math.sin(phaseC);
  const dx =
    0.013 *
    (waveA * 0.62 + waveB * 0.24 + waveC * 0.14) *
    (0.72 + 0.28 * Number(wind)) *
    rim;
  const dy = 0.011 * (waveB * 0.52 - waveC * 0.33 + waveA * 0.15) * rim;
  const dz = 0.007 * (waveC * 0.56 + waveA * 0.29 - waveB * 0.15) * rim;
  const radial = x * dx + y * dy + z * dz;
  const movedX = x + dx - x * radial;
  const movedY = y + dy - y * radial;
  const movedZ = z + dz - z * radial;
  const inverseLength = 1 / Math.hypot(movedX, movedY, movedZ);
  out[offset] = movedX * inverseLength;
  out[offset + 1] = movedY * inverseLength;
  out[offset + 2] = movedZ * inverseLength;
}

export function createOrbSurfaceSimulation(graph: OrbGraph) {
  const baseline = graph.positions;
  const count = baseline.length / 3;
  const positions = baseline.slice();
  const opacities = new Float32Array(count).fill(1);
  const states = new Uint8Array(count);
  const cuts = new Float32Array(CUT_COUNT * 4);
  const trackingCandidates = selectOrbBoundaryNodes(graph).slice(0, CUT_COUNT);
  const period = Math.max(32, trackingCandidates.length * RELEASE_SPACING);
  const birthPosition = new Float32Array(3);

  for (let order = 0; order < trackingCandidates.length; order += 1) {
    const index = trackingCandidates[order];
    cuts[order * 4] = baseline[index * 3];
    cuts[order * 4 + 1] = baseline[index * 3 + 1];
    cuts[order * 4 + 2] = 5 / 243;
  }

  function update(time: number, motion: boolean, wind = true) {
    const seconds = Number.isFinite(time) ? Math.max(0, time) : 0;
    opacities.fill(1);
    states.fill(ORB_NODE_ATTACHED);
    for (let order = 0; order < CUT_COUNT; order += 1) {
      cuts[order * 4 + 3] = 0;
    }

    if (!motion) {
      positions.set(baseline);
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      writeOrbSurface(
        positions,
        offset,
        baseline[offset],
        baseline[offset + 1],
        baseline[offset + 2],
        seconds,
        true,
        wind,
      );
    }
    if (!wind) return;

    for (let order = 0; order < trackingCandidates.length; order += 1) {
      const release = FIRST_RELEASE + order * RELEASE_SPACING;
      if (seconds < release) continue;
      const elapsed = seconds - release;
      const age = elapsed % period;
      const rejoinStart = FLIGHT_DURATION + HIDDEN_DURATION;
      if (age >= rejoinStart + REJOIN_DURATION) continue;

      const index = trackingCandidates[order];
      const offset = index * 3;
      const cutOffset = order * 4 + 3;
      if (age < FLIGHT_DURATION) {
        const birth = seconds - age;
        writeOrbSurface(
          birthPosition,
          0,
          baseline[offset],
          baseline[offset + 1],
          baseline[offset + 2],
          birth,
          true,
          true,
        );
        // Acceleration starts at zero and always carries the same point left.
        const seed = graph.seeds[index];
        const travel = age - 0.58 * (1 - Math.exp(-age / 0.58));
        const speed = 0.12 + seed * 0.036;
        const lift = (seed - 0.5) * 0.028;
        positions[offset] = birthPosition[0] - speed * travel;
        positions[offset + 1] =
          birthPosition[1] +
          lift * travel +
          Math.sin(age * 1.1 + seed * 9) * 0.007 * smoothstep(0, 1.1, age);
        positions[offset + 2] =
          birthPosition[2] + (seed - 0.5) * travel * 0.014;
        opacities[index] = 1 - smoothstep(3, FLIGHT_DURATION, age);
        cuts[cutOffset] = smoothstep(0, 0.2, age);
        states[index] = age < 1.05 ? ORB_NODE_DETACHING : ORB_NODE_FREE;
      } else if (age < rejoinStart) {
        // Relocation happens only while invisible, so nothing flies backward.
        opacities[index] = 0;
        cuts[cutOffset] = 1;
        states[index] = ORB_NODE_FADED;
      } else {
        const restored = smoothstep(
          rejoinStart,
          rejoinStart + REJOIN_DURATION,
          age,
        );
        opacities[index] = restored;
        cuts[cutOffset] = 1 - restored;
        states[index] = ORB_NODE_REJOINING;
      }
    }
  }

  return {
    positions,
    opacities,
    states,
    cuts,
    trackingCandidates,
    update,
  };
}
