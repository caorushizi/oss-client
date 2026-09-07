// The broken left silhouette makes the image bounds asymmetric around the shell.
export const orbReference = {
  width: 645,
  height: 706,
  centerX: 288,
  centerY: 377,
  radius: 243,
} as const;

export type OrbGraph = {
  positions: Float32Array;
  strengths: Float32Array;
  sizes: Float32Array;
  seeds: Float32Array;
  edges: Uint16Array;
  edgeStrengths: Float32Array;
};

type SourceNode = { x: number; y: number; peak: number; highlight: boolean };
type SourcePath = { a: number; b: number; pixels: number[] };
type SourceEdge = { a: number; b: number; strength: number };

// Recover the reference's connected threads rather than inventing nearest-
// neighbor links. The source is used once as a topology/brightness blueprint.
export function createOrbGraph(image: ImageData): OrbGraph {
  const { width, height, data } = image;
  const scaleX = width / orbReference.width;
  const scaleY = height / orbReference.height;
  const sourceScale = Math.min(scaleX, scaleY);
  const length = width * height;
  const alpha = new Uint8Array(length);
  const integralWidth = width + 1;
  const integral = new Uint32Array(integralWidth * (height + 1));
  for (let y = 0; y < height; y += 1) {
    let sum = 0;
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      alpha[index] = data[index * 4 + 3];
      sum += alpha[index];
      integral[(y + 1) * integralWidth + x + 1] =
        integral[y * integralWidth + x + 1] + sum;
    }
  }
  const localAlpha = (x: number, y: number, radius: number) => {
    const column = Math.round(x);
    const row = Math.round(y);
    const left = Math.max(0, column - radius);
    const right = Math.min(width, column + radius + 1);
    const top = Math.max(0, row - radius);
    const bottom = Math.min(height, row + radius + 1);
    return (
      (integral[bottom * integralWidth + right] -
        integral[top * integralWidth + right] -
        integral[bottom * integralWidth + left] +
        integral[top * integralWidth + left]) /
      ((right - left) * (bottom - top))
    );
  };
  const mask = new Uint8Array(length);
  const sourcePixels: number[] = [];
  const neighborhood = Math.max(2, Math.round(3 * sourceScale));
  type Profile = { offsets: number[]; weights: number[] };
  const profile = (angle: number, perpendicular: number): Profile => {
    const weights = new Map<number, number>();
    for (const along of [-1.25, 0, 1.25]) {
      const x =
        (Math.cos(angle) * along - Math.sin(angle) * perpendicular) *
        sourceScale;
      const y =
        (Math.sin(angle) * along + Math.cos(angle) * perpendicular) *
        sourceScale;
      const left = Math.floor(x);
      const top = Math.floor(y);
      const fractionX = x - left;
      const fractionY = y - top;
      const alongWeight = along === 0 ? 0.5 : 0.25;
      for (let dy = 0; dy <= 1; dy += 1) {
        for (let dx = 0; dx <= 1; dx += 1) {
          const weight =
            (dx ? fractionX : 1 - fractionX) *
            (dy ? fractionY : 1 - fractionY) *
            alongWeight;
          if (!weight) continue;
          const offset = (top + dy) * width + left + dx;
          weights.set(offset, (weights.get(offset) ?? 0) + weight);
        }
      }
    }
    return { offsets: [...weights.keys()], weights: [...weights.values()] };
  };
  const directions = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * Math.PI) / 8;
    return {
      center: profile(angle, 0),
      positive: profile(angle, 1.6),
      negative: profile(angle, -1.6),
    };
  });
  const response = (index: number, kernel: Profile) => {
    let value = 0;
    for (let tap = 0; tap < kernel.offsets.length; tap += 1)
      value += alpha[index + kernel.offsets[tap]] * kernel.weights[tap];
    return value;
  };
  const border = Math.max(4, Math.ceil(4 * sourceScale));
  for (let y = border; y < height - border; y += 1) {
    for (let x = border; x < width - border; x += 1) {
      const sx = (x / scaleX - orbReference.centerX) / orbReference.radius;
      const sy = (y / scaleY - orbReference.centerY) / orbReference.radius;
      if (sx * sx + sy * sy > 0.996 ** 2) continue;
      const index = y * width + x;
      if (alpha[index] < 1) continue;
      let ridge = false;
      // A thread is brighter than BOTH of its perpendicular flanks. Testing
      // eight directions follows fine straight strands through overlapping
      // light, while rejecting the broad haze that thins into cellular cracks.
      for (const direction of directions) {
        const center = response(index, direction.center);
        const threshold = Math.max(0.3, center * 0.03);
        if (
          alpha[index] >= center * 0.65 &&
          center - response(index, direction.positive) > threshold &&
          center - response(index, direction.negative) > threshold
        ) {
          ridge = true;
          break;
        }
      }
      if (!ridge) continue;
      mask[index] = 1;
      sourcePixels.push(index);
    }
  }

  const offsets = [
    -width,
    -width + 1,
    1,
    width + 1,
    width,
    width - 1,
    -1,
    -width - 1,
  ];
  const removed: number[] = [];
  // Topology-preserving thinning leaves a one-pixel centerline. Its holes and
  // branches survive; no lines are added across the source's torn regions.
  let changed = true;
  let iteration = 0;
  while (changed && iteration < 32) {
    changed = false;
    iteration += 1;
    for (let pass = 0; pass < 2; pass += 1) {
      removed.length = 0;
      for (const index of sourcePixels) {
        if (!mask[index]) continue;
        let count = 0;
        let transitions = 0;
        for (let direction = 0; direction < 8; direction += 1) {
          const neighbor = mask[index + offsets[direction]];
          count += neighbor;
          if (!neighbor && mask[index + offsets[(direction + 1) % 8]])
            transitions += 1;
        }
        if (count < 2 || count > 6 || transitions !== 1) continue;
        const north = mask[index - width];
        const east = mask[index + 1];
        const south = mask[index + width];
        const west = mask[index - 1];
        if (
          pass === 0
            ? north * east * south || east * south * west
            : north * east * west || north * south * west
        )
          continue;
        removed.push(index);
      }
      if (removed.length) changed = true;
      for (const index of removed) mask[index] = 0;
    }
  }
  const pixels = sourcePixels.filter((index) => mask[index]);
  const links = new Uint8Array(length);
  const degree = new Uint8Array(length);
  const critical: number[] = [];
  const sourcePeaks = new Int32Array(length).fill(-1);
  for (const index of pixels) {
    let linkMask = 0;
    let count = 0;
    for (let direction = 0; direction < 8; direction += 1) {
      if (!mask[index + offsets[direction]]) continue;
      // A diagonal next to a cardinal connection is the same rasterized
      // thread, not an extra triangular edge or an additional junction.
      if (
        direction % 2 &&
        (mask[index + offsets[(direction + 7) % 8]] ||
          mask[index + offsets[(direction + 1) % 8]])
      )
        continue;
      linkMask |= 1 << direction;
      count += 1;
    }
    links[index] = linkMask;
    degree[index] = count;
    // A luminous knot can have only two incident threads. Keep actual bright
    // source maxima on those paths rather than losing them during simplification.
    let peakIndex = index;
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nearby = index + dy * width + dx;
        if (alpha[nearby] > alpha[peakIndex]) peakIndex = nearby;
      }
    }
    const peak = alpha[peakIndex];
    const peakX = peakIndex % width;
    const peakY = Math.floor(peakIndex / width);
    const prominence = peak - localAlpha(peakX, peakY, neighborhood);
    let maximum = true;
    for (let dy = -1; dy <= 1 && maximum; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const nearby = peakIndex + dy * width + dx;
        if (
          alpha[nearby] > peak ||
          (alpha[nearby] === peak && nearby < peakIndex)
        ) {
          maximum = false;
          break;
        }
      }
    }
    let alongThread = 0;
    if (maximum) {
      for (const direction of directions)
        alongThread = Math.max(
          alongThread,
          response(peakIndex, direction.center),
        );
    }
    if (
      maximum &&
      peak >= 8 &&
      prominence >= Math.max(4, peak * 0.22) &&
      peak - alongThread >= Math.max(1, peak * 0.055)
    ) {
      let nearest = -1;
      let nearestDistance = Infinity;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nearby = peakIndex + dy * width + dx;
          if (!mask[nearby]) continue;
          const distance = dx * dx + dy * dy;
          if (
            distance < nearestDistance ||
            (distance === nearestDistance && nearby < nearest)
          ) {
            nearest = nearby;
            nearestDistance = distance;
          }
        }
      }
      if (nearest === index) sourcePeaks[index] = peakIndex;
    }
    if (count !== 2 || sourcePeaks[index] >= 0) critical.push(index);
  }
  critical.sort(
    (a, b) =>
      alpha[sourcePeaks[b] >= 0 ? sourcePeaks[b] : b] -
        alpha[sourcePeaks[a] >= 0 ? sourcePeaks[a] : a] || a - b,
  );
  const owners = new Int32Array(length).fill(-1);
  const nodes: SourceNode[] = [];
  for (const index of critical) {
    if (owners[index] >= 0) continue;
    const x = index % width;
    const y = Math.floor(index / width);
    const owner = nodes.length;
    const projectedRadius =
      Math.hypot(
        x / scaleX - orbReference.centerX,
        y / scaleY - orbReference.centerY,
      ) / orbReference.radius;
    const limb = Math.max(0, Math.min(1, (projectedRadius - 0.7) / 0.2));
    const clusterRadius = (2.05 - limb * 0.6) * sourceScale;
    const cluster = [index];
    owners[index] = owner;
    let weightedX = 0;
    let weightedY = 0;
    let weight = 0;
    let peakIndex = sourcePeaks[index] >= 0 ? sourcePeaks[index] : index;
    let hasSourcePeak = sourcePeaks[index] >= 0;
    // Parallel threads become extremely close at the limb. A spatial radius
    // alone would weld separate threads into cells; merge only pixels reached
    // along the existing skeleton and retain a smaller footprint at the limb.
    for (let cursor = 0; cursor < cluster.length; cursor += 1) {
      const current = cluster[cursor];
      const px = current % width;
      const py = Math.floor(current / width);
      weightedX += px * alpha[current];
      weightedY += py * alpha[current];
      weight += alpha[current];
      const sourcePeak = sourcePeaks[current];
      if (sourcePeak >= 0 && alpha[sourcePeak] >= alpha[peakIndex]) {
        peakIndex = sourcePeak;
        hasSourcePeak = true;
      } else if (!hasSourcePeak && alpha[current] > alpha[peakIndex]) {
        peakIndex = current;
      }
      for (let direction = 0; direction < 8; direction += 1) {
        if (!(links[current] & (1 << direction))) continue;
        const nearby = current + offsets[direction];
        if (owners[nearby] >= 0) continue;
        const dx = (nearby % width) - x;
        const dy = Math.floor(nearby / width) - y;
        if (dx * dx + dy * dy > clusterRadius * clusterRadius) continue;
        owners[nearby] = owner;
        cluster.push(nearby);
      }
    }
    nodes.push({
      x: hasSourcePeak ? peakIndex % width : weightedX / weight,
      y: hasSourcePeak ? Math.floor(peakIndex / width) : weightedY / weight,
      peak: alpha[peakIndex],
      highlight: degree[index] > 0 || hasSourcePeak,
    });
  }

  const visited = new Uint8Array(length);
  const paths: SourcePath[] = [];
  const visit = (index: number, direction: number) => {
    const neighbor = index + offsets[direction];
    visited[index] |= 1 << direction;
    visited[neighbor] |= 1 << ((direction + 4) % 8);
    return neighbor;
  };
  const trace = (start: number, direction: number) => {
    const origin = owners[start];
    let current = visit(start, direction);
    let previous = start;
    const path = [start, current];
    while (owners[current] < 0 && path.length < pixels.length) {
      let nextDirection = -1;
      for (let next = 0; next < 8; next += 1) {
        if (
          links[current] & (1 << next) &&
          current + offsets[next] !== previous &&
          !(visited[current] & (1 << next))
        ) {
          nextDirection = next;
          break;
        }
      }
      if (nextDirection < 0) break;
      previous = current;
      current = visit(current, nextDirection);
      path.push(current);
    }
    const target = owners[current];
    if (target >= 0 && (origin !== target || path.length > 10))
      paths.push({ a: origin, b: target, pixels: path });
  };
  for (const index of pixels) {
    if (owners[index] < 0) continue;
    for (let direction = 0; direction < 8; direction += 1) {
      if (
        links[index] & (1 << direction) &&
        !(visited[index] & (1 << direction)) &&
        owners[index + offsets[direction]] !== owners[index]
      )
        trace(index, direction);
    }
  }
  // Closed source loops have no endpoints/junctions, but still belong to the
  // shell. Give each loop a quiet control vertex and follow the same path.
  for (const index of pixels) {
    if (owners[index] >= 0 || visited[index] || !links[index]) continue;
    owners[index] = nodes.length;
    nodes.push({
      x: index % width,
      y: Math.floor(index / width),
      peak: alpha[index],
      highlight: false,
    });
    for (let direction = 0; direction < 8; direction += 1) {
      if (links[index] & (1 << direction)) {
        trace(index, direction);
        break;
      }
    }
  }

  const edges: SourceEdge[] = [];
  const selectedEdges = new Map<string, SourceEdge>();
  for (const path of paths) {
    const indices = [0];
    const simplify = (lo: number, hi: number) => {
      if (hi - lo < 2) return;
      const first = path.pixels[lo];
      const last = path.pixels[hi];
      const x = first % width;
      const y = Math.floor(first / width);
      const dx = (last % width) - x;
      const dy = Math.floor(last / width) - y;
      const squaredLength = dx * dx + dy * dy;
      let furthest = -1;
      let deviation = 0;
      for (let index = lo + 1; index < hi; index += 1) {
        const pixel = path.pixels[index];
        const px = (pixel % width) - x;
        const py = Math.floor(pixel / width) - y;
        const t = squaredLength
          ? Math.max(0, Math.min(1, (px * dx + py * dy) / squaredLength))
          : 0;
        const distance = (px - dx * t) ** 2 + (py - dy * t) ** 2;
        if (distance > deviation) {
          deviation = distance;
          furthest = index;
        }
      }
      if (
        deviation > (1.25 * sourceScale) ** 2 ||
        squaredLength > (36 * sourceScale) ** 2
      ) {
        if (furthest < 0) furthest = Math.floor((lo + hi) / 2);
        simplify(lo, furthest);
        indices.push(furthest);
        simplify(furthest, hi);
      }
    };
    simplify(0, path.pixels.length - 1);
    indices.push(path.pixels.length - 1);
    let a = path.a;
    for (let segment = 1; segment < indices.length; segment += 1) {
      const start = indices[segment - 1];
      const end = indices[segment];
      let b = path.b;
      if (segment < indices.length - 1) {
        const pixel = path.pixels[end];
        b = nodes.length;
        nodes.push({
          x: pixel % width,
          y: Math.floor(pixel / width),
          peak: alpha[pixel],
          highlight: false,
        });
      }
      if (a !== b) {
        let sum = 0;
        for (let index = start; index <= end; index += 1)
          sum += alpha[path.pixels[index]];
        const strength = Math.min(1, sum / (end - start + 1) / 77);
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        const existing = selectedEdges.get(key);
        if (existing) existing.strength = Math.max(existing.strength, strength);
        else {
          const edge = { a, b, strength };
          selectedEdges.set(key, edge);
          edges.push(edge);
        }
      }
      a = b;
    }
  }

  // Remove isolated raster specks. Every retained point is part of the traced
  // shell; path bends are movable vertices but never artificial bright dots.
  const connected = new Uint8Array(nodes.length);
  for (const edge of edges) {
    connected[edge.a] = 1;
    connected[edge.b] = 1;
  }
  const remap = new Uint16Array(nodes.length);
  const selected = nodes.filter((_, index) => connected[index]);
  const positions = new Float32Array(selected.length * 3);
  const strengths = new Float32Array(selected.length);
  const sizes = new Float32Array(selected.length);
  const seeds = new Float32Array(selected.length);
  let next = 0;
  nodes.forEach((node, index) => {
    if (!connected[index]) return;
    remap[index] = next;
    const x = (node.x / scaleX - orbReference.centerX) / orbReference.radius;
    const y = (orbReference.centerY - node.y / scaleY) / orbReference.radius;
    const peak = Math.max(
      0,
      node.peak - localAlpha(node.x, node.y, neighborhood) * 0.65,
    );
    const strength = node.highlight ? Math.min(1, peak / 77) : 0;
    positions.set([x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y))], next * 3);
    strengths[next] = strength;
    sizes[next] = 0.55 + Math.sqrt(strength) * 0.7;
    seeds[next] = ((node.x * 73 + node.y * 151) % 997) / 997;
    next += 1;
  });
  const edgeIndices = new Uint16Array(edges.length * 2);
  const edgeStrengths = new Float32Array(edges.length);
  edges.forEach((edge, index) => {
    edgeIndices[index * 2] = remap[edge.a];
    edgeIndices[index * 2 + 1] = remap[edge.b];
    edgeStrengths[index] = edge.strength;
  });
  return {
    positions,
    strengths,
    sizes,
    seeds,
    edges: edgeIndices,
    edgeStrengths,
  };
}
