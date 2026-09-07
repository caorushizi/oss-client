import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";
import { createReferenceOrbGraph } from "./scene-orb-data";
import { orbReference } from "./scene-orb-geometry";
import { createOrbSurfaceSimulation } from "./scene-orb-surface";
import {
  connectionsFragment,
  connectionsVertex,
  nodesFragment,
  nodesVertex,
} from "./scene-orb-shaders";

export type OrbTheme = { hue: number; offsetX: number; offsetY: number };
export type OrbPlayback = {
  playing?: boolean;
  motion?: boolean;
  wind?: boolean;
  speed?: number;
  trackedNode?: number | null;
};
export type OrbScene = {
  setTheme: (theme: OrbTheme) => void;
  setPlayback: (options: OrbPlayback) => void;
  seek: (seconds: number) => void;
  getSnapshot: () => {
    ready: boolean;
    time: number;
    nodeCount: number;
    edgeCount: number;
    trackedNode: number | null;
    trackedState: string | null;
    trackingCandidates: number[];
  };
  dispose: () => void;
};

export function createOrbScene(
  host: HTMLDivElement,
  initialTheme: OrbTheme,
  initialPlayback: OrbPlayback = {},
): OrbScene {
  const renderer = new WebGLRenderer({
    alpha: true,
    // Filaments and points already have analytic soft edges. Multisampling
    // their transparent quads adds a full-size resolve without smoothing them.
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  const resources: (BufferGeometry | ShaderMaterial)[] = [];
  const cleanup: (() => void)[] = [];
  let disposed = false;
  let frame = 0;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    cleanup.forEach((release) => release());
    resources.forEach((resource) => resource.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    delete host.dataset.ready;
  };

  try {
    const track = <T extends BufferGeometry | ShaderMaterial>(
      resource: T,
    ): T => {
      resources.push(resource);
      return resource;
    };
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
    camera.position.z = 1000;
    const root = new Group();
    scene.add(root);
    let theme = initialTheme;
    const color = new Color().setHSL(theme.hue / 360, 0.32, 0.6);
    const targetColor = color.clone();
    const playback = {
      playing: true,
      motion: true,
      wind: true,
      speed: 1,
      trackedNode: null as number | null,
      ...initialPlayback,
    };
    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: color },
      uPixelRatio: { value: 1 },
      uScale: { value: 1 },
      uTrackedNode: { value: -1 },
      uMotion: { value: 1 },
      uViewport: { value: new Vector2(1, 1) },
    };
    const material = (vertexShader: string, fragmentShader: string) =>
      track(
        new ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
        }),
      );
    let simulation: ReturnType<typeof createOrbSurfaceSimulation> | undefined;
    let copyGeometry = () => {};
    const dynamicAttributes: { needsUpdate: boolean }[] = [];
    const dynamicAttribute = (values: Float32Array, itemSize: number) => {
      const attribute = new BufferAttribute(values, itemSize).setUsage(
        DynamicDrawUsage,
      );
      dynamicAttributes.push(attribute);
      return attribute;
    };
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "scene-orb-canvas";
    host.append(renderer.domElement);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let contextLost = false;
    let visible = true;
    let width = 0;
    let height = 0;
    let elapsed = 0;
    let lastTime = 0;
    let pointerX = 0;
    let pointerY = 0;
    let smoothedX = 0;
    let smoothedY = 0;
    let offsetX = theme.offsetX;
    let offsetY = theme.offsetY;
    let failed = false;
    const animating = () =>
      playback.playing && playback.motion && !reducedMotion.matches;
    const syncSimulation = () =>
      simulation?.update(
        elapsed,
        playback.motion && !reducedMotion.matches,
        playback.wind,
      );
    const canRender = () =>
      !disposed &&
      !failed &&
      !contextLost &&
      Boolean(simulation) &&
      visible &&
      !document.hidden &&
      width > 0 &&
      height > 0;

    const draw = (delta: number) => {
      const ease = !animating() ? 1 : 1 - Math.exp(-delta * 2.8);
      color.lerp(targetColor, ease);
      offsetX += (theme.offsetX - offsetX) * ease;
      offsetY += (theme.offsetY - offsetY) * ease;
      if (animating()) {
        smoothedX += (pointerX - smoothedX) * ease;
        smoothedY += (pointerY - smoothedY) * ease;
      }
      const imageScale = Math.min(1, width / 865, height / 645);
      uniforms.uScale.value = imageScale;
      // Radius and center have no time-dependent term. Only real node positions
      // change, on the sphere or along their own outgoing trajectory.
      root.scale.setScalar(orbReference.radius * imageScale);
      root.position.set(
        -width / 2 + (offsetX + orbReference.centerX) * imageScale,
        -height / 2 +
          (orbReference.height - orbReference.centerY - offsetY) * imageScale,
        0,
      );
      root.rotation.set(smoothedY * 0.018, smoothedX * 0.024, 0);
      syncSimulation();
      copyGeometry();
      for (const attribute of dynamicAttributes) attribute.needsUpdate = true;
      uniforms.uMotion.value =
        playback.motion && !reducedMotion.matches ? 1 : 0;
      uniforms.uTime.value =
        playback.motion && !reducedMotion.matches ? elapsed : 0;
      uniforms.uTrackedNode.value = playback.trackedNode ?? -1;
      renderer.render(scene, camera);
      if (!failed && host.dataset.ready !== "true") host.dataset.ready = "true";
    };
    const render = (delta: number) => {
      try {
        draw(delta);
      } catch (error) {
        failed = true;
        delete host.dataset.ready;
        cancelAnimationFrame(frame);
        frame = 0;
        console.warn("Orb rendering stopped", error);
      }
    };
    const tick = (now: number) => {
      frame = 0;
      if (!canRender()) return;
      // Follow display refresh directly. Dropping elapsed remainders to impose
      // 30 FPS produced uneven intervals on common 60/75/144 Hz displays.
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.08) : 1 / 60;
      lastTime = now;
      if (animating()) elapsed += delta * playback.speed;
      render(delta);
      if (canRender() && animating()) frame = requestAnimationFrame(tick);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (disposed || failed) return;
      // Controls describe the requested time even while the canvas is offscreen.
      // Visibility gates GPU work, not the preview's simulation state.
      if (!canRender()) {
        syncSimulation();
        return;
      }
      render(0);
      if (canRender() && animating()) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) {
        resume();
        return;
      }
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        1.5,
        Math.sqrt(2_000_000 / (width * height)),
      );
      uniforms.uPixelRatio.value = pixelRatio;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      uniforms.uViewport.value.set(width, height);

      camera.left = -width / 2;
      camera.right = width / 2;
      camera.top = height / 2;
      camera.bottom = -height / 2;
      camera.updateProjectionMatrix();
      resume();
    };
    const parent = host.parentElement ?? host;
    const pointerMove = (event: PointerEvent) => {
      if (!animating() || event.pointerType === "touch") return;
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      pointerX = Math.max(
        -1,
        Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
      );
      pointerY = Math.max(
        -1,
        Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
      );
    };
    const resetPointer = () => {
      pointerX = 0;
      pointerY = 0;
    };
    const motionChange = () => {
      resetPointer();
      smoothedX = 0;
      smoothedY = 0;
      resume();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      delete host.dataset.ready;
      resume();
    };
    const onContextRestored = () => {
      contextLost = false;
      resize();
    };
    renderer.debug.onShaderError = () => {
      failed = true;
      delete host.dataset.ready;
      console.warn("Orb shader compilation failed");
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    cleanup.push(
      () => resizeObserver.disconnect(),
      () => intersectionObserver.disconnect(),
    );
    resizeObserver.observe(host);
    intersectionObserver.observe(host);
    parent.addEventListener("pointermove", pointerMove, { passive: true });
    parent.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", resume);
    reducedMotion.addEventListener("change", motionChange);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener(
      "webglcontextrestored",
      onContextRestored,
    );
    cleanup.push(() => {
      parent.removeEventListener("pointermove", pointerMove);
      parent.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", resume);
      reducedMotion.removeEventListener("change", motionChange);
      renderer.domElement.removeEventListener(
        "webglcontextlost",
        onContextLost,
      );
      renderer.domElement.removeEventListener(
        "webglcontextrestored",
        onContextRestored,
      );
    });

    const graph = createReferenceOrbGraph();
    simulation = createOrbSurfaceSimulation(graph);

    const connections = { edges: graph.edges, strengths: graph.edgeStrengths };
    const edgeCount = connections.strengths.length;
    const edgeStarts = new Float32Array(edgeCount * 3);
    const edgeEnds = new Float32Array(edgeCount * 3);
    const edgeOpacities = new Float32Array(edgeCount);
    const edgeLengths = new Float32Array(edgeCount);
    const incidentNodes = new Set<number>(connections.edges);
    const edgeGeometry = track(new InstancedBufferGeometry());
    edgeGeometry.setAttribute(
      "position",
      new BufferAttribute(
        new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]),
        3,
      ),
    );
    edgeGeometry.setIndex([0, 2, 1, 2, 3, 1]);
    edgeGeometry.instanceCount = edgeCount;
    const edgeAttribute = (values: Float32Array, itemSize: number) => {
      const attribute = new InstancedBufferAttribute(values, itemSize).setUsage(
        DynamicDrawUsage,
      );
      dynamicAttributes.push(attribute);
      return attribute;
    };
    edgeGeometry.setAttribute("aStart", edgeAttribute(edgeStarts, 3));
    edgeGeometry.setAttribute("aEnd", edgeAttribute(edgeEnds, 3));
    edgeGeometry.setAttribute("aOpacity", edgeAttribute(edgeOpacities, 1));
    edgeGeometry.setAttribute(
      "aStrength",
      new InstancedBufferAttribute(connections.strengths, 1),
    );
    const lines = new Mesh(
      edgeGeometry,
      material(connectionsVertex, connectionsFragment),
    );
    lines.frustumCulled = false;
    lines.renderOrder = 1;
    root.add(lines);
    for (let edge = 0; edge < edgeCount; edge += 1) {
      const a = connections.edges[edge * 2] * 3;
      const b = connections.edges[edge * 2 + 1] * 3;
      edgeLengths[edge] = Math.hypot(
        graph.positions[a] - graph.positions[b],
        graph.positions[a + 1] - graph.positions[b + 1],
        graph.positions[a + 2] - graph.positions[b + 2],
      );
    }

    // Junction cores remain sparse: subdivision vertices aren't light sources.
    const selected = simulation.trackingCandidates.slice();
    const byBrightness = Array.from(incidentNodes).sort(
      (a, b) => graph.strengths[b] - graph.strengths[a],
    );
    for (const index of byBrightness) {
      if (selected.length >= 700 || graph.strengths[index] < 0.3) break;
      const x = graph.positions[index * 3];
      const y = graph.positions[index * 3 + 1];
      if (
        selected.some(
          (other) =>
            Math.hypot(
              x - graph.positions[other * 3],
              y - graph.positions[other * 3 + 1],
            ) < 0.018,
        )
      )
        continue;
      selected.push(index);
    }
    const connectionVisibility = new Float32Array(graph.strengths.length);
    const visiblePositions = new Float32Array(selected.length * 3);
    const visibleOpacities = new Float32Array(selected.length);
    const released = new Float32Array(selected.length);
    const nodes = track(new BufferGeometry());
    nodes.setAttribute("position", dynamicAttribute(visiblePositions, 3));
    nodes.setAttribute("aOpacity", dynamicAttribute(visibleOpacities, 1));
    nodes.setAttribute("aReleased", dynamicAttribute(released, 1));
    nodes.setAttribute(
      "aStrength",
      new BufferAttribute(
        new Float32Array(selected.map((index) => graph.strengths[index])),
        1,
      ),
    );
    nodes.setAttribute(
      "aSeed",
      new BufferAttribute(
        new Float32Array(selected.map((index) => graph.seeds[index])),
        1,
      ),
    );
    nodes.setAttribute(
      "aNodeIndex",
      new BufferAttribute(new Float32Array(selected), 1),
    );
    copyGeometry = () => {
      if (!simulation) return;
      connectionVisibility.fill(1);
      for (
        let order = 0;
        order < simulation.trackingCandidates.length;
        order += 1
      ) {
        connectionVisibility[simulation.trackingCandidates[order]] =
          1 - simulation.cuts[order * 4 + 3];
      }
      for (let edge = 0; edge < edgeCount; edge += 1) {
        const a = connections.edges[edge * 2];
        const b = connections.edges[edge * 2 + 1];
        for (let axis = 0; axis < 3; axis += 1) {
          edgeStarts[edge * 3 + axis] = simulation.positions[a * 3 + axis];
          edgeEnds[edge * 3 + axis] = simulation.positions[b * 3 + axis];
        }
        const length = Math.hypot(
          edgeStarts[edge * 3] - edgeEnds[edge * 3],
          edgeStarts[edge * 3 + 1] - edgeEnds[edge * 3 + 1],
          edgeStarts[edge * 3 + 2] - edgeEnds[edge * 3 + 2],
        );
        const stretch = Math.max(
          0,
          length / Math.max(0.001, edgeLengths[edge]) - 1.25,
        );
        edgeOpacities[edge] =
          Math.min(connectionVisibility[a], connectionVisibility[b]) /
          (1 + stretch * 3);
      }
      for (let index = 0; index < selected.length; index += 1) {
        const source = selected[index];
        visiblePositions[index * 3] = simulation.positions[source * 3];
        visiblePositions[index * 3 + 1] = simulation.positions[source * 3 + 1];
        visiblePositions[index * 3 + 2] = simulation.positions[source * 3 + 2];
        visibleOpacities[index] = simulation.opacities[source];
        released[index] =
          simulation.states[source] === 1 || simulation.states[source] === 2
            ? 1
            : 0;
      }
    };
    const points = new Points(nodes, material(nodesVertex, nodesFragment));
    points.frustumCulled = false;
    points.renderOrder = 2;
    root.add(points);

    resize();
    return {
      setTheme(nextTheme) {
        theme = nextTheme;
        targetColor.setHSL(theme.hue / 360, 0.32, 0.6);
        resume();
      },
      setPlayback(options) {
        if (options.playing !== undefined) playback.playing = options.playing;
        if (options.motion !== undefined) playback.motion = options.motion;
        if (options.wind !== undefined) playback.wind = options.wind;
        if (options.speed !== undefined && Number.isFinite(options.speed))
          playback.speed = Math.max(0.05, Math.min(4, options.speed));
        if (options.trackedNode !== undefined) {
          const index = options.trackedNode;
          playback.trackedNode =
            index !== null &&
            Number.isInteger(index) &&
            index >= 0 &&
            index < (simulation?.opacities.length ?? 0)
              ? index
              : null;
        }
        if (!playback.motion) {
          resetPointer();
          smoothedX = 0;
          smoothedY = 0;
        }
        resume();
      },
      seek(seconds) {
        if (Number.isFinite(seconds)) elapsed = Math.max(0, seconds);
        resume();
      },
      getSnapshot() {
        const trackedNode = playback.trackedNode;
        const state =
          trackedNode !== null ? simulation?.states[trackedNode] : undefined;
        return {
          ready: host.dataset.ready === "true",
          time: elapsed,
          nodeCount: simulation?.opacities.length ?? 0,
          edgeCount,
          trackedNode,
          trackedState:
            state === undefined
              ? null
              : ["attached", "detaching", "free", "faded", "rejoining"][state],
          trackingCandidates: simulation?.trackingCandidates ?? [],
        };
      },
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
