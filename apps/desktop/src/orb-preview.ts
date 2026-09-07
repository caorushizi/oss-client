import referenceImageUrl from "./assets/images/global.png";
import { createOrbScene } from "./components/app/scene-orb-renderer";

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Missing preview element: ${id}`);
  return found as T;
}

element<HTMLImageElement>("reference").src = referenceImageUrl;

const host = element<HTMLDivElement>("orb");
const preview = element<HTMLElement>("preview");
const compareButton = element<HTMLButtonElement>("compare-view");
const detailButton = element<HTMLButtonElement>("detail-view");
const staticButton = element<HTMLButtonElement>("static");
const playButton = element<HTMLButtonElement>("play");
const resetButton = element<HTMLButtonElement>("reset");
const speedSelect = element<HTMLSelectElement>("speed");
const windInput = element<HTMLInputElement>("wind");
const trackInput = element<HTMLInputElement>("track");
const nodeSelect = element<HTMLSelectElement>("node");
const timeOutput = element<HTMLOutputElement>("time");
const timeline = element<HTMLInputElement>("timeline");
const modeLabel = element<HTMLDivElement>("mode-label");
const instruction = element<HTMLParagraphElement>("instruction");
const tracking = element<HTMLParagraphElement>("tracking");
const reducedNote = element<HTMLParagraphElement>("reduced-motion");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let playing = !reducedMotion.matches;
let motion = !reducedMotion.matches;
let populated = false;
let disposed = false;

const stateLabels: Record<string, string> = {
  attached: "随球面移动",
  detaching: "正在被风拉开",
  free: "已经离开球壳",
  faded: "已淡出画面",
  rejoining: "从球面淡入",
};

const setLayout = (layout: "compare" | "detail") => {
  preview.dataset.layout = layout;
  compareButton.setAttribute("aria-pressed", String(layout === "compare"));
  detailButton.setAttribute("aria-pressed", String(layout === "detail"));
};
compareButton.addEventListener("click", () => setLayout("compare"));
detailButton.addEventListener("click", () => setLayout("detail"));

try {
  const scene = createOrbScene(
    host,
    { hue: 197, offsetX: 60, offsetY: 0 },
    { playing, motion, wind: true, speed: 1 },
  );

  const refresh = () => {
    if (disposed) return;
    const snapshot = scene.getSnapshot();
    if (snapshot.ready && !populated) {
      nodeSelect.replaceChildren();
      snapshot.trackingCandidates.forEach((node, index) => {
        const option = document.createElement("option");
        option.value = String(node);
        option.textContent = `左侧节点 ${index + 1}`;
        nodeSelect.append(option);
      });
      populated = true;
      trackInput.disabled = snapshot.trackingCandidates.length === 0;
      if (trackInput.checked && nodeSelect.value) {
        scene.setPlayback({ trackedNode: Number(nodeSelect.value) });
      }
    }
    nodeSelect.disabled =
      !trackInput.checked || !populated || !nodeSelect.options.length;
    timeOutput.value = `${snapshot.time.toFixed(1).padStart(4, "0")} 秒`;
    if (snapshot.time > Number(timeline.max)) {
      timeline.max = String(Math.ceil(snapshot.time / 60) * 60);
    }
    timeline.value = String(snapshot.time);
    timeline.setAttribute("aria-valuetext", `${snapshot.time.toFixed(1)} 秒`);
    staticButton.setAttribute("aria-pressed", String(!motion));
    playButton.setAttribute("aria-pressed", String(playing));
    playButton.textContent = playing ? "暂停" : "播放";
    modeLabel.textContent = !motion
      ? "静态对照"
      : playing && !reducedMotion.matches
        ? "光流与风正在流动"
        : "运动已暂停";
    instruction.textContent = !motion
      ? "对照原图，查看细密丝线、明亮交点与左侧自然散开的轮廓。"
      : windInput.checked
        ? "节点沿球面微动，直线随之伸缩；左侧亮点随风离开。"
        : "节点在球面上轻微流动，连线改变长度和方向，始终保持笔直。";
    tracking.hidden = !trackInput.checked;
    if (trackInput.checked) {
      const state = snapshot.trackedState;
      const label = nodeSelect.selectedOptions[0]?.textContent ?? "节点";
      tracking.textContent = `${label} · ${!motion ? "球面上的原始位置" : state ? (stateLabels[state] ?? state) : "等待节点就绪"}`;
    }
    reducedNote.hidden = !reducedMotion.matches;
    playButton.disabled = reducedMotion.matches;
    timeline.disabled = reducedMotion.matches;
  };

  staticButton.addEventListener("click", () => {
    playing = false;
    motion = false;
    scene.setPlayback({ playing, motion });
    scene.seek(0);
    refresh();
  });
  playButton.addEventListener("click", () => {
    motion = true;
    playing = !playing;
    scene.setPlayback({ playing, motion });
    refresh();
  });
  resetButton.addEventListener("click", () => {
    scene.seek(0);
    refresh();
  });
  const pauseForSeek = () => {
    playing = false;
    motion = true;
    scene.setPlayback({ playing, motion });
  };
  timeline.addEventListener("pointerdown", pauseForSeek);
  timeline.addEventListener("keydown", (event) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    )
      pauseForSeek();
  });
  timeline.addEventListener("input", () => {
    pauseForSeek();
    scene.seek(Number(timeline.value));
    refresh();
  });
  speedSelect.addEventListener("change", () => {
    scene.setPlayback({ speed: Number(speedSelect.value) });
    refresh();
  });
  windInput.addEventListener("change", () => {
    scene.setPlayback({ wind: windInput.checked });
    refresh();
  });
  const updateTracking = () => {
    scene.setPlayback({
      trackedNode:
        trackInput.checked && populated && nodeSelect.value
          ? Number(nodeSelect.value)
          : null,
    });
    refresh();
  };
  trackInput.addEventListener("change", updateTracking);
  nodeSelect.addEventListener("change", updateTracking);
  reducedMotion.addEventListener("change", refresh);
  const interval = window.setInterval(refresh, 200);
  refresh();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    window.clearInterval(interval);
    reducedMotion.removeEventListener("change", refresh);
    scene.dispose();
  };
  window.addEventListener("pagehide", dispose, { once: true });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
} catch (error) {
  element<HTMLSpanElement>("loading").textContent =
    "球壳预览暂时无法启动，请确认浏览器已启用图形加速。";
  for (const control of [
    staticButton,
    playButton,
    resetButton,
    speedSelect,
    windInput,
    trackInput,
    nodeSelect,
    timeline,
  ]) {
    control.disabled = true;
  }
  console.error("Orb comparison could not start", error);
}
