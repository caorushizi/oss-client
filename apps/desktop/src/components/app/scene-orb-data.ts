import packed from "./scene-orb-straight.json";
import { orbReference, type OrbGraph } from "./scene-orb-geometry";

let referenceGraph: OrbGraph | undefined;

function decodeBase64(value: string): DataView {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1)
    bytes[index] = binary.charCodeAt(index);
  return new DataView(bytes.buffer);
}

// Shared immutable construction data. The simulation owns copies of all
// mutable positions; rebuilding a scene never re-runs image analysis.
export function createReferenceOrbGraph(): OrbGraph {
  if (referenceGraph) return referenceGraph;
  const { nodeCount, edgeCount, coordinatePrecision } = packed;
  const nodeData = decodeBase64(packed.nodes);
  const edgeData = decodeBase64(packed.edges);
  if (
    packed.version !== 1 ||
    coordinatePrecision !== 32 ||
    nodeCount > 65535 ||
    nodeData.byteLength !== nodeCount * 5 ||
    edgeData.byteLength !== edgeCount * 5
  )
    throw new Error("Unsupported packed orb graph.");
  const positions = new Float32Array(nodeCount * 3);
  const strengths = new Float32Array(nodeCount);
  const sizes = new Float32Array(nodeCount);
  const seeds = new Float32Array(nodeCount);
  const edges = new Uint16Array(edgeCount * 2);
  const edgeStrengths = new Float32Array(edgeCount);
  for (let node = 0; node < nodeCount; node += 1) {
    const sourceX = nodeData.getUint16(node * 5, true) / coordinatePrecision;
    const sourceY =
      nodeData.getUint16(node * 5 + 2, true) / coordinatePrecision;
    const x = (sourceX - orbReference.centerX) / orbReference.radius;
    const y = (orbReference.centerY - sourceY) / orbReference.radius;
    const strength = nodeData.getUint8(node * 5 + 4) / 255;
    positions[node * 3] = x;
    positions[node * 3 + 1] = y;
    positions[node * 3 + 2] = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    strengths[node] = strength;
    sizes[node] = 0.55 + Math.sqrt(strength) * 0.7;
    seeds[node] = ((sourceX * 73 + sourceY * 151) % 997) / 997;
  }
  for (let edge = 0; edge < edgeCount; edge += 1) {
    const a = edgeData.getUint16(edge * 5, true);
    const b = edgeData.getUint16(edge * 5 + 2, true);
    if (a >= nodeCount || b >= nodeCount)
      throw new Error("Packed orb graph contains an invalid node index.");
    edges[edge * 2] = a;
    edges[edge * 2 + 1] = b;
    const edgeStrength = edgeData.getUint8(edge * 5 + 4) / 255;
    edgeStrengths[edge] =
      packed.edgeStrengthEncoding === "sqrt"
        ? edgeStrength * edgeStrength
        : edgeStrength;
  }
  referenceGraph = { positions, strengths, sizes, seeds, edges, edgeStrengths };
  return referenceGraph;
}
