import {
  ChevronLeft,
  Copy,
  Download,
  Grid2X2,
  List,
  Maximize2,
  Minus,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import { animated, useTransition } from "@react-spring/web";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import transferDoneAudioSrc from "../assets/audios/tip.mp3";
import iconfontSource from "../assets/iconfont.js?raw";
import { AppEmptyState } from "../components/app/empty-state";
import {
  FileTypeIcon as IconFont,
  fileIconName,
} from "../components/app/file-type-icon";
import { IconButton } from "../components/app/icon-button";
import { SceneOrb } from "../components/app/scene-orb";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Button } from "../components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../components/ui/input-group";
import { SidebarProvider } from "../components/ui/sidebar";
import { useBuckets, type Bucket } from "../features/buckets/use-buckets";
import {
  useObjects,
  type ObjectPage,
  type StorageObject,
} from "../features/objects/use-objects";
import { ProfilesPage } from "../features/profiles/ProfilesPage";
import { useProfiles } from "../features/profiles/use-profiles";
import {
  SettingsPage,
  type ClassicSettings,
} from "../features/settings/SettingsPage";
import { AppSidebar, type AppView } from "../features/shell/AppSidebar";
import { TransferPage } from "../features/transfers/TransferPage";
import {
  useTransfers,
  type TransferTask,
} from "../features/transfers/use-transfers";
import { apiRequest } from "../lib/backend/client";
import { formatBytes, formatDate } from "../lib/formatters";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/app-store";

type ObjectLayout = "grid" | "table";
type ObjectSort = { key: "name" | "size" | "date"; direction: "asc" | "desc" };
type ExpandedUploadFile = { localPath: string; relativePath: string };
type PageDirection = -1 | 1;
type SelectionRectangle = {
  left: number;
  top: number;
  width: number;
  height: number;
};
type SelectionDrag = {
  pointerId: number;
  startX: number;
  startY: number;
  originalKeys: Set<string>;
  baseKeys: Set<string>;
  additive: boolean;
  started: boolean;
  firstMatchedKey: string | undefined;
};
const classicSettingsStorageKey = "oss-client:classic-settings:v2";
const legacyClassicSettingsStorageKey = "oss-client:classic-settings";
const objectLayoutStorageKey = "oss-client:object-layout:v1";
const legacyObjectLayoutStorageKey = "oss-client:object-layout";
const defaultClassicSettings: ClassicSettings = {
  useHttps: true,
  deleteShowDialog: true,
  uploadOverwrite: false,
  downloadDir: "",
  transferDoneTip: true,
  markdown: false,
  showFloatWindow: false,
  floatWindowStyle: "circle",
  uploadRename: false,
};

type SceneVisual = {
  accent: string;
  accentSoft: string;
  background: string;
  orbHue: number;
  orbOffsetX: number;
  orbOffsetY: number;
  key: string;
  sidebarEnd: string;
  sidebarStart: string;
  view: AppView;
};

const viewHues: Record<AppView, number> = {
  browser: 166,
  transfers: 220,
  completed: 142,
  settings: 32,
  profiles: 354,
};

const viewOrder: Record<AppView, number> = {
  browser: 0,
  transfers: 1,
  completed: 2,
  settings: 3,
  profiles: 4,
};

export function App() {
  useEffect(() => {
    if (!isTauri()) return;
    const currentWindow = getCurrentWindow();
    let disposed = false;
    let revision = 0;
    const syncWindowShape = async () => {
      const request = ++revision;
      try {
        const [maximized, fullscreen] = await Promise.all([
          currentWindow.isMaximized(),
          currentWindow.isFullscreen(),
        ]);
        if (!disposed && request === revision) {
          document.documentElement.classList.toggle(
            "is-expanded-window",
            maximized || fullscreen,
          );
        }
      } catch (error) {
        console.error("Failed to synchronize window corners", error);
      }
    };
    const unlisten = currentWindow.onResized(() => void syncWindowShape());
    void unlisten.then(syncWindowShape).catch(console.error);
    return () => {
      disposed = true;
      void unlisten.then((dispose) => dispose()).catch(console.error);
    };
  }, []);

  const profiles = useProfiles();
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const activeBucket = useAppStore((state) => state.activeBucket);
  const prefix = useAppStore((state) => state.prefix);
  const setActiveProfileId = useAppStore((state) => state.setActiveProfileId);
  const setActiveBucket = useAppStore((state) => state.setActiveBucket);
  const setPrefix = useAppStore((state) => state.setPrefix);
  const buckets = useBuckets(activeProfileId);
  const objects = useObjects(activeProfileId, activeBucket, prefix);
  const transfers = useTransfers();
  const mutateTransfers = transfers.mutate;
  const [activeView, setActiveView] = useState<AppView>("browser");
  const [pageDirection, setPageDirection] = useState<PageDirection>(1);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [transferError, setTransferError] = useState<string>();
  const [floatWindowError, setFloatWindowError] = useState<string>();
  const [layout, setLayout] = useState<ObjectLayout>(loadObjectLayout);
  const [objectSort, setObjectSort] = useState<ObjectSort>({
    key: "name",
    direction: "asc",
  });
  const [searchValue, setSearchValue] = useState("");
  const [selectedObjectKeys, setSelectedObjectKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectionRectangle, setSelectionRectangle] =
    useState<SelectionRectangle>();
  const objectContentRef = useRef<HTMLDivElement>(null);
  const selectionAnchorKeyRef = useRef<string | undefined>(undefined);
  const selectionDragRef = useRef<SelectionDrag | undefined>(undefined);
  const knownTerminalTransferIdsRef = useRef<Set<string> | undefined>(
    undefined,
  );
  const [classicSettings, setClassicSettings] =
    useState<ClassicSettings>(loadClassicSettings);
  const sceneKey =
    activeView === "browser"
      ? `browser:${activeBucket?.name ?? "empty"}`
      : activeView;
  const scene = useMemo(
    () => createSceneVisual(sceneKey, activeView),
    [activeView, sceneKey],
  );
  const deferredSearchValue = useDeferredValue(searchValue);
  const breadcrumbs = createBreadcrumbs(prefix);
  const profilesById = useMemo(
    () =>
      new Map((profiles.data ?? []).map((profile) => [profile.id, profile])),
    [profiles.data],
  );
  const activeProfile = activeProfileId
    ? profilesById.get(activeProfileId)
    : undefined;

  function navigate(nextView: AppView) {
    if (nextView === activeView) return;
    setPageDirection(viewOrder[nextView] < viewOrder[activeView] ? -1 : 1);
    setHasNavigated(true);
    setActiveView(nextView);
  }

  const visibleObjects = useMemo(() => {
    const query = deferredSearchValue.trim().toLocaleLowerCase();
    const filtered = query
      ? (objects.items ?? []).filter((object) =>
          objectLabel(object.key, prefix).toLocaleLowerCase().includes(query),
        )
      : [...(objects.items ?? [])];
    return filtered.sort((left, right) =>
      compareObjects(left, right, prefix, objectSort),
    );
  }, [deferredSearchValue, objectSort, objects.items, prefix]);

  const selectedObjects = visibleObjects.filter((object) =>
    selectedObjectKeys.has(object.key),
  );
  const selectedObject =
    selectedObjects.length === 1 ? selectedObjects[0] : undefined;
  const [activeTransfers, completedTransfers] = useMemo(() => {
    const active: TransferTask[] = [];
    const completed: TransferTask[] = [];
    for (const task of transfers.data ?? []) {
      if (task.status === "queued" || task.status === "running") {
        active.push(task);
      } else {
        completed.push(task);
      }
    }
    return [active, completed] as const;
  }, [transfers.data]);
  const runningTransfers = activeTransfers;

  const clearObjectSelection = useCallback(() => {
    setSelectedObjectKeys((current) =>
      current.size === 0 ? current : new Set(),
    );
    selectionAnchorKeyRef.current = undefined;
  }, []);

  const startUploadPaths = useCallback(
    async (paths: string[]) => {
      if (!activeProfileId || !activeBucket || paths.length === 0) return;
      setTransferError(undefined);
      try {
        const files = isTauri()
          ? await invoke<ExpandedUploadFile[]>("expand_upload_paths", { paths })
          : paths.map((localPath) => ({
              localPath,
              relativePath: fileNameFromPath(localPath),
            }));
        for (const file of files) {
          await apiRequest("/api/v1/transfers", {
            method: "POST",
            body: JSON.stringify({
              direction: "upload",
              profileId: activeProfileId,
              bucket: activeBucket.name,
              region: activeBucket.region,
              objectKey: prefix + file.relativePath,
              localPath: file.localPath,
              overwrite: classicSettings.uploadOverwrite,
              useHttps: classicSettings.useHttps,
            }),
          });
        }
        await mutateTransfers();
      } catch (error) {
        setTransferError(
          error instanceof Error ? error.message : "上传任务启动失败",
        );
      }
    },
    [
      activeBucket,
      activeProfileId,
      classicSettings.uploadOverwrite,
      classicSettings.useHttps,
      prefix,
      mutateTransfers,
    ],
  );

  useEffect(() => {
    return installIconFont();
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const unlisten = listen("navigate-to-settings", () => {
      setPageDirection(1);
      setHasNavigated(true);
      setActiveView("settings");
    });
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, []);

  useEffect(() => {
    if (!isTauri()) return;
    const unlisten = listen<{ visible: boolean; style: "circle" | "oval" }>(
      "float-window-state",
      ({ payload }) =>
        setClassicSettings((current) => {
          if (
            current.showFloatWindow === payload.visible &&
            current.floatWindowStyle === payload.style
          ) {
            return current;
          }
          return {
            ...current,
            showFloatWindow: payload.visible,
            floatWindowStyle: payload.style,
          };
        }),
    );
    return () => {
      void unlisten.then((dispose) => dispose());
    };
  }, []);

  useEffect(() => {
    if (!isTauri() || activeView !== "browser") return;
    let disposed = false;
    let unlisten: (() => void) | undefined;
    void getCurrentWindow()
      .onDragDropEvent(({ payload }) => {
        if (!disposed && payload.type === "drop") {
          void startUploadPaths(payload.paths);
        }
      })
      .then((dispose) => {
        if (disposed) {
          dispose();
        } else {
          unlisten = dispose;
        }
      });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [activeView, startUploadPaths]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        classicSettingsStorageKey,
        JSON.stringify(classicSettings),
      );
    } catch {
      // 隐私模式或存储空间不足时保留当前会话中的设置。
    }
  }, [classicSettings]);

  useEffect(() => {
    try {
      window.localStorage.setItem(objectLayoutStorageKey, layout);
    } catch {
      // 本地存储不可用时仍允许在当前会话切换布局。
    }
  }, [layout]);

  useEffect(() => {
    const tasks = transfers.data;
    if (!tasks) return;
    const terminalIds = new Set(
      tasks
        .filter((task) => task.status === "completed")
        .map((task) => task.id),
    );
    const known = knownTerminalTransferIdsRef.current;
    knownTerminalTransferIdsRef.current = terminalIds;
    if (!known || !classicSettings.transferDoneTip) return;
    if ([...terminalIds].some((id) => !known.has(id))) playTransferDoneTone();
  }, [classicSettings.transferDoneTip, transfers.data]);

  useEffect(() => {
    if (!isTauri()) return;
    let active = true;
    void invoke("set_float_window", {
      visible: classicSettings.showFloatWindow,
      style: classicSettings.floatWindowStyle,
    })
      .then(() => {
        if (active) setFloatWindowError(undefined);
      })
      .catch((error: unknown) => {
        if (active) setFloatWindowError(errorMessage(error, "悬浮窗设置失败"));
      });
    return () => {
      active = false;
    };
  }, [classicSettings.floatWindowStyle, classicSettings.showFloatWindow]);

  useEffect(() => {
    if (!isTauri()) return;
    const context =
      activeProfileId && activeBucket
        ? {
            profileId: activeProfileId,
            bucket: activeBucket.name,
            region: activeBucket.region,
            prefix,
            rename: classicSettings.uploadRename,
            overwrite: classicSettings.uploadOverwrite,
            useHttps: classicSettings.useHttps,
          }
        : null;
    void invoke("set_float_upload_context", { context }).catch(
      (error: unknown) =>
        setFloatWindowError(errorMessage(error, "无法同步悬浮窗上传位置")),
    );
  }, [
    activeBucket,
    activeProfileId,
    classicSettings.uploadOverwrite,
    classicSettings.uploadRename,
    classicSettings.useHttps,
    prefix,
  ]);

  useEffect(() => {
    if (
      profiles.data?.length &&
      !profiles.data.some((profile) => profile.id === activeProfileId)
    ) {
      setActiveProfileId(profiles.data[0].id);
    }
  }, [activeProfileId, profiles.data, setActiveProfileId]);

  useEffect(() => {
    if (profiles.data && profiles.data.length === 0) {
      setPageDirection(1);
      setHasNavigated(true);
      setActiveView("profiles");
    }
  }, [profiles.data]);

  useEffect(() => {
    if (
      buckets.data?.length &&
      !buckets.data.some(
        (bucket) =>
          bucket.name === activeBucket?.name &&
          (bucket.region ?? "") === (activeBucket?.region ?? ""),
      )
    ) {
      const defaultBucket = buckets.data.find(
        (bucket) => bucket.name === activeProfile?.uploadBucket,
      );
      setActiveBucket(defaultBucket ?? buckets.data[0]);
      if (defaultBucket && activeProfile?.uploadPrefix) {
        setPrefix(activeProfile.uploadPrefix);
      }
    } else if (buckets.data?.length === 0 && activeBucket) {
      setActiveBucket(undefined);
    }
  }, [activeBucket, activeProfile, buckets.data, setActiveBucket, setPrefix]);

  useEffect(() => {
    clearObjectSelection();
    setSelectionRectangle(undefined);
    setSearchValue("");
  }, [activeBucket?.name, clearObjectSelection, prefix]);

  useEffect(() => {
    const visibleKeys = new Set(visibleObjects.map((object) => object.key));
    if (
      selectionAnchorKeyRef.current &&
      !visibleKeys.has(selectionAnchorKeyRef.current)
    ) {
      selectionAnchorKeyRef.current = undefined;
    }
    setSelectedObjectKeys((current) => {
      const next = new Set(
        [...current].filter((objectKey) => visibleKeys.has(objectKey)),
      );
      return next.size === current.size ? current : next;
    });
  }, [visibleObjects]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (activeView !== "browser") return;
      if (event.key === "Escape") {
        clearObjectSelection();
        return;
      }
      if (
        event.key.toLocaleLowerCase() !== "a" ||
        (!event.ctrlKey && !event.metaKey) ||
        isEditableTarget(event.target)
      ) {
        return;
      }
      event.preventDefault();
      setSelectedObjectKeys(
        new Set(visibleObjects.map((object) => object.key)),
      );
      selectionAnchorKeyRef.current = visibleObjects[0]?.key;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView, clearObjectSelection, visibleObjects]);

  async function uploadFiles() {
    if (!activeProfileId || !activeBucket) return;
    try {
      const selected = await open({
        multiple: true,
        directory: false,
        title: "选择要上传的文件",
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      await startUploadPaths(paths);
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "上传任务启动失败",
      );
    }
  }

  async function downloadObject(object: StorageObject) {
    if (!activeProfileId || !activeBucket || object.isDirectory) return;
    setTransferError(undefined);
    try {
      const fileName = objectLabel(object.key, prefix);
      const localPath = classicSettings.downloadDir
        ? joinLocalPath(classicSettings.downloadDir, fileName)
        : await save({
            defaultPath: fileName,
            title: "保存文件",
          });
      if (!localPath) return;
      await apiRequest("/api/v1/transfers", {
        method: "POST",
        body: JSON.stringify({
          direction: "download",
          profileId: activeProfileId,
          bucket: activeBucket.name,
          region: activeBucket.region,
          objectKey: object.key,
          localPath,
          overwrite: true,
          useHttps: classicSettings.useHttps,
        }),
      });
      await transfers.mutate();
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "下载任务启动失败",
      );
    }
  }

  async function downloadSelectedObjects() {
    if (!activeProfileId || !activeBucket || selectedObjects.length === 0)
      return;
    if (selectedObjects.length === 1 && !selectedObjects[0].isDirectory) {
      await downloadObject(selectedObjects[0]);
      return;
    }
    setTransferError(undefined);
    try {
      const selectedDirectory = classicSettings.downloadDir
        ? classicSettings.downloadDir
        : await open({
            directory: true,
            multiple: false,
            title: "选择下载位置",
          });
      if (typeof selectedDirectory !== "string") return;

      const files: Array<{ object: StorageObject; relativePath: string }> = [];
      for (const object of selectedObjects) {
        if (object.isDirectory) {
          files.push(...(await listDirectoryFiles(object)));
        } else {
          files.push({ object, relativePath: objectLabel(object.key, prefix) });
        }
      }
      for (const file of files) {
        const localPath = isTauri()
          ? await invoke<string>("prepare_download_path", {
              baseDirectory: selectedDirectory,
              relativePath: file.relativePath,
            })
          : joinLocalPath(selectedDirectory, file.relativePath);
        await apiRequest("/api/v1/transfers", {
          method: "POST",
          body: JSON.stringify({
            direction: "download",
            profileId: activeProfileId,
            bucket: activeBucket.name,
            region: activeBucket.region,
            objectKey: file.object.key,
            localPath,
            overwrite: true,
            useHttps: classicSettings.useHttps,
          }),
        });
      }
      await transfers.mutate();
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "下载任务启动失败",
      );
    }
  }

  async function listDirectoryFiles(directory: StorageObject) {
    if (!activeProfileId || !activeBucket) return [];
    const result: Array<{ object: StorageObject; relativePath: string }> = [];
    const queue = [directory.key];
    const rootName = objectLabel(directory.key, prefix);
    while (queue.length) {
      const directoryPrefix = queue.shift();
      if (!directoryPrefix) continue;
      let cursor = "";
      do {
        const query = new URLSearchParams({
          bucket: activeBucket.name,
          prefix: directoryPrefix,
          limit: "1000",
        });
        if (activeBucket.region) query.set("region", activeBucket.region);
        if (cursor) query.set("cursor", cursor);
        const page = await apiRequest<ObjectPage>(
          `/api/v1/profiles/${activeProfileId}/objects?${query}`,
        );
        for (const object of page.items) {
          if (object.isDirectory) {
            queue.push(object.key);
          } else if (object.key !== directory.key) {
            result.push({
              object,
              relativePath: `${rootName}/${object.key.slice(directory.key.length)}`,
            });
          }
        }
        cursor = page.hasMore ? (page.cursor ?? "") : "";
      } while (cursor);
    }
    return result;
  }

  async function copySelectedObjectAddress() {
    if (
      !selectedObject ||
      selectedObject.isDirectory ||
      !activeProfile?.defaultDomain
    )
      return;
    const url = publicObjectUrl(
      activeProfile.defaultDomain,
      selectedObject.key,
      classicSettings.useHttps,
    );
    const text = classicSettings.markdown
      ? `![${objectLabel(selectedObject.key, prefix)}](${url})`
      : url;
    try {
      await navigator.clipboard.writeText(text);
      setTransferError(undefined);
    } catch (error) {
      setTransferError(errorMessage(error, "复制地址失败"));
    }
  }

  function selectObject(
    event: React.MouseEvent<HTMLElement>,
    objectKey: string,
  ) {
    const additive = event.ctrlKey || event.metaKey;
    const anchorKey = selectionAnchorKeyRef.current;

    if (event.shiftKey && anchorKey) {
      const anchorIndex = visibleObjects.findIndex(
        (object) => object.key === anchorKey,
      );
      const objectIndex = visibleObjects.findIndex(
        (object) => object.key === objectKey,
      );
      if (anchorIndex !== -1 && objectIndex !== -1) {
        const firstIndex = Math.min(anchorIndex, objectIndex);
        const lastIndex = Math.max(anchorIndex, objectIndex);
        const rangeKeys = visibleObjects
          .slice(firstIndex, lastIndex + 1)
          .map((object) => object.key);
        setSelectedObjectKeys((current) => {
          const next = additive ? new Set(current) : new Set<string>();
          for (const rangeKey of rangeKeys) next.add(rangeKey);
          return next;
        });
        return;
      }
    }

    selectionAnchorKeyRef.current = objectKey;
    if (additive) {
      setSelectedObjectKeys((current) => {
        const next = new Set(current);
        if (next.has(objectKey)) {
          next.delete(objectKey);
        } else {
          next.add(objectKey);
        }
        return next;
      });
      return;
    }
    setSelectedObjectKeys(new Set([objectKey]));
  }

  function handleObjectPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      event.pointerType !== "mouse" ||
      visibleObjects.length === 0
    ) {
      return;
    }
    const target = event.target;
    if (target instanceof Element && target.closest("[data-object-key]")) {
      return;
    }

    const container = objectContentRef.current;
    if (!container) return;
    const point = contentPoint(container, event.clientX, event.clientY);
    const additive = event.ctrlKey || event.metaKey;
    selectionDragRef.current = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      originalKeys: new Set(selectedObjectKeys),
      baseKeys: additive ? new Set(selectedObjectKeys) : new Set(),
      additive,
      started: false,
      firstMatchedKey: undefined,
    };
    setSelectionRectangle(undefined);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleObjectPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = selectionDragRef.current;
    const container = objectContentRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !container) return;

    const point = contentPoint(container, event.clientX, event.clientY);
    if (
      !drag.started &&
      Math.hypot(point.x - drag.startX, point.y - drag.startY) < 8
    ) {
      return;
    }

    drag.started = true;
    const rectangle = createSelectionRectangle(
      drag.startX,
      drag.startY,
      point.x,
      point.y,
    );
    const containerBounds = container.getBoundingClientRect();
    const next = new Set(drag.baseKeys);
    let firstMatchedKey: string | undefined;
    for (const element of container.querySelectorAll<HTMLElement>(
      "[data-object-key]",
    )) {
      const objectKey = element.dataset.objectKey;
      if (!objectKey) continue;
      const bounds = element.getBoundingClientRect();
      const itemRectangle: SelectionRectangle = {
        left: bounds.left - containerBounds.left + container.scrollLeft,
        top: bounds.top - containerBounds.top + container.scrollTop,
        width: bounds.width,
        height: bounds.height,
      };
      if (rectanglesOverlap(rectangle, itemRectangle)) {
        next.add(objectKey);
        firstMatchedKey ??= objectKey;
      }
    }
    drag.firstMatchedKey = firstMatchedKey;
    setSelectionRectangle(rectangle);
    setSelectedObjectKeys(next);
    event.preventDefault();
  }

  function handleObjectPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = selectionDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    if (!drag.started && !drag.additive) {
      clearObjectSelection();
    } else if (drag.started && !drag.additive) {
      selectionAnchorKeyRef.current = drag.firstMatchedKey;
    }
    selectionDragRef.current = undefined;
    setSelectionRectangle(undefined);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleObjectPointerCancel(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const drag = selectionDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setSelectedObjectKeys(new Set(drag.originalKeys));
    selectionDragRef.current = undefined;
    setSelectionRectangle(undefined);
  }

  async function cancelTransfer(id: string) {
    try {
      await apiRequest(`/api/v1/transfers/${id}`, { method: "DELETE" });
      await transfers.mutate();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "取消任务失败");
    }
  }

  async function clearCompletedTransfers() {
    try {
      await apiRequest("/api/v1/transfers/completed", { method: "DELETE" });
      await transfers.mutate();
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : "清空记录失败");
    }
  }

  function openBucket(bucket: Bucket) {
    if (activeView === "browser" && activeBucket?.name === bucket.name) {
      return;
    }

    if (activeView === "browser") {
      const currentIndex =
        buckets.data?.findIndex(
          (candidate) => candidate.name === activeBucket?.name,
        ) ?? -1;
      const nextIndex =
        buckets.data?.findIndex(
          (candidate) => candidate.name === bucket.name,
        ) ?? currentIndex + 1;
      setPageDirection(nextIndex < currentIndex ? -1 : 1);
    } else {
      setPageDirection(-1);
    }

    setHasNavigated(true);
    setActiveBucket(bucket);
    setActiveView("browser");
  }

  function openObject(object: StorageObject) {
    if (object.isDirectory) {
      setPrefix(object.key);
      return;
    }

    const endpoint = activeProfile?.endpoint?.trim();
    if (
      objectLabel(object.key, prefix) !== "index.html" ||
      !endpoint ||
      !activeBucket
    ) {
      return;
    }

    void invoke("open_external_url", {
      url: pathStyleObjectUrl(endpoint, activeBucket.name, object.key),
    });
  }

  async function selectDownloadDirectory() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "选择下载位置",
    });
    if (typeof selected === "string") {
      setClassicSettings((value) => ({ ...value, downloadDir: selected }));
    }
  }

  async function openDownloadDirectory() {
    if (!classicSettings.downloadDir || !isTauri()) return;
    try {
      await invoke("open_directory", { path: classicSettings.downloadDir });
    } catch (error) {
      setTransferError(errorMessage(error, "无法打开下载位置"));
    }
  }

  function renderBrowser() {
    return (
      <section className="legacy-page legacy-browser">
        <div className="legacy-button-bar">
          <Button
            size="sm"
            disabled={!activeBucket}
            onClick={() => void uploadFiles()}
          >
            <Upload data-icon="inline-start" />
            上传文件
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={selectedObjects.length === 0}
            onClick={() => void downloadSelectedObjects()}
          >
            <Download data-icon="inline-start" />
            下载
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={
              !selectedObject ||
              selectedObject.isDirectory ||
              !activeProfile?.defaultDomain
            }
            onClick={() => void copySelectedObjectAddress()}
          >
            <Copy data-icon="inline-start" />
            复制地址
          </Button>
          <Button size="sm" variant="destructive" disabled>
            删除
          </Button>
        </div>

        <div className="legacy-browser-toolbar">
          <div className="flex min-w-0 items-center gap-1.5">
            <IconButton
              label="返回上一级"
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={!prefix}
              onClick={() => setPrefix(parentPrefix(prefix))}
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              label="刷新文件"
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void objects.mutate()}
            >
              <RefreshCw />
            </IconButton>
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap gap-1 text-xs">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setPrefix("")}
                    >
                      首页
                    </Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((item, index) => (
                  <BreadcrumbItem key={item.path} className="min-w-0">
                    <BreadcrumbSeparator />
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="max-w-28 truncate text-xs">
                        {item.name}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="max-w-28 truncate"
                          onClick={() => setPrefix(item.path)}
                        >
                          {item.name}
                        </Button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="legacy-browser-actions">
            <InputGroup className="h-7 w-48">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label="搜索文件"
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  clearObjectSelection();
                }}
                placeholder="搜索文件"
              />
            </InputGroup>
            <IconButton
              label={layout === "grid" ? "切换到列表" : "切换到网格"}
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setLayout(layout === "grid" ? "table" : "grid");
                clearObjectSelection();
              }}
            >
              {layout === "grid" ? <List /> : <Grid2X2 />}
            </IconButton>
          </div>
        </div>

        {transferError ? (
          <Alert variant="destructive" className="mx-3 mt-2 w-auto py-2">
            <AlertDescription>{transferError}</AlertDescription>
          </Alert>
        ) : null}

        <div
          ref={objectContentRef}
          className={cn(
            "legacy-object-content",
            selectionRectangle && "is-selecting",
          )}
          onPointerDown={handleObjectPointerDown}
          onPointerMove={handleObjectPointerMove}
          onPointerUp={handleObjectPointerUp}
          onPointerCancel={handleObjectPointerCancel}
          onLostPointerCapture={handleObjectPointerCancel}
          onScroll={(event) => {
            const target = event.currentTarget;
            if (
              objects.hasMore &&
              !objects.isValidating &&
              target.scrollHeight - target.scrollTop - target.clientHeight < 160
            ) {
              void objects.loadMore();
            }
          }}
        >
          {objects.error ? (
            <AppEmptyState
              title="读取失败"
              description={
                objects.error instanceof Error
                  ? objects.error.message
                  : "无法读取当前目录"
              }
            />
          ) : !activeBucket ? (
            <AppEmptyState
              title="没有 Bucket"
              description={
                activeProfileId ? "当前没有选中的存储桶" : "请先添加云账号"
              }
            />
          ) : objects.isLoading ? (
            <AppEmptyState
              title="正在读取"
              description="正在获取当前目录中的文件"
            />
          ) : visibleObjects.length === 0 ? (
            <AppEmptyState
              title={searchValue ? "没有搜索结果" : "没有文件"}
              description={
                searchValue
                  ? "当前目录没有匹配的文件"
                  : "当前 Bucket 中没有文件"
              }
            />
          ) : layout === "grid" ? (
            <div className="legacy-file-grid">
              {visibleObjects.map((object) => (
                <Button
                  type="button"
                  variant="ghost"
                  key={`${object.isDirectory ? "d" : "f"}:${object.key}`}
                  data-object-key={object.key}
                  className={cn(
                    "legacy-file-cell",
                    selectedObjectKeys.has(object.key) && "is-selected",
                  )}
                  aria-selected={selectedObjectKeys.has(object.key)}
                  onClick={(event) => selectObject(event, object.key)}
                  onDoubleClick={() => openObject(object)}
                  title={objectLabel(object.key, prefix)}
                >
                  {object.isDirectory ? (
                    <IconFont
                      type="icon-wenjian"
                      className="legacy-file-icon legacy-folder-file-icon"
                    />
                  ) : activeProfile?.defaultDomain && isImageObject(object) ? (
                    <img
                      className="legacy-file-icon legacy-file-thumbnail"
                      src={publicObjectUrl(
                        activeProfile.defaultDomain,
                        object.key,
                        classicSettings.useHttps,
                      )}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <IconFont
                      type={fileIconName(object.key)}
                      className="legacy-file-icon"
                    />
                  )}
                  <span>{objectLabel(object.key, prefix)}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="legacy-file-table" role="table">
              <div className="legacy-file-row legacy-file-head" role="row">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    toggleObjectSort("name", objectSort, setObjectSort)
                  }
                >
                  文件名{sortIndicator(objectSort, "name")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    toggleObjectSort("size", objectSort, setObjectSort)
                  }
                >
                  大小{sortIndicator(objectSort, "size")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() =>
                    toggleObjectSort("date", objectSort, setObjectSort)
                  }
                >
                  修改日期{sortIndicator(objectSort, "date")}
                </Button>
              </div>
              {visibleObjects.map((object) => (
                <div
                  key={`${object.isDirectory ? "d" : "f"}:${object.key}`}
                  data-object-key={object.key}
                  className={cn(
                    "legacy-file-row",
                    selectedObjectKeys.has(object.key) && "is-selected",
                  )}
                  role="row"
                  aria-selected={selectedObjectKeys.has(object.key)}
                  onClick={(event) => selectObject(event, object.key)}
                  onDoubleClick={() => openObject(object)}
                >
                  <span className="legacy-file-name">
                    {object.isDirectory ? (
                      <IconFont
                        type="icon-wenjian"
                        className="legacy-table-icon"
                      />
                    ) : (
                      <IconFont
                        type={fileIconName(object.key)}
                        className="legacy-table-icon"
                      />
                    )}
                    <span>{objectLabel(object.key, prefix)}</span>
                  </span>
                  <span>
                    {object.isDirectory ? "文件夹" : formatBytes(object.size)}
                  </span>
                  <span>{formatDate(object.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
          {selectionRectangle && (
            <div
              className="legacy-selection-rectangle"
              style={selectionRectangle}
            />
          )}
        </div>

        <footer className="legacy-status-bar">
          <span>
            <strong>选中{selectedObjects.length}项</strong>
            /总共{visibleObjects.length}项
          </span>
          <span>
            {activeProfile?.defaultDomain?.trim() ||
              activeProfile?.endpoint?.trim() ||
              "没有绑定域名"}
          </span>
        </footer>
      </section>
    );
  }

  const shellStyle = {
    "--cloud-accent": scene.accent,
    "--cloud-accent-soft": scene.accentSoft,
    "--cloud-sidebar-end": scene.sidebarEnd,
    "--cloud-sidebar-start": scene.sidebarStart,
    "--legacy-app-gradient": scene.background,
    "--legacy-aside-gradient": `linear-gradient(180deg, ${scene.sidebarStart}, ${scene.sidebarEnd})`,
    background: scene.background,
  } as CSSProperties;
  const backgroundTransitions = useTransition(scene, {
    keys: ({ key }) => key,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      duration: 480,
    },
    immediate: !hasNavigated,
  });
  const viewTransitions = useTransition(scene, {
    keys: ({ key }) => key,
    // Release each finished page even during a rapid sequence of navigations.
    expires: 1,
    from: {
      y: hasNavigated ? pageDirection * 100 : 0,
    },
    enter: { y: 0 },
    leave: {
      y: pageDirection * -100,
    },
    config: {
      mass: 0.86,
      tension: 210,
      friction: 28,
      precision: 0.001,
    },
    immediate: !hasNavigated,
  });

  return (
    <SidebarProvider
      data-view={activeView}
      className="legacy-app [--sidebar-width:225px]"
      style={shellStyle}
    >
      <AppSidebar
        activeView={activeView}
        activeBucket={activeBucket}
        buckets={buckets.data}
        bucketsLoading={Boolean(activeProfileId && buckets.isLoading)}
        runningTransfers={runningTransfers.length}
        onOpenBucket={openBucket}
        onNavigate={navigate}
      />

      <main className="legacy-main">
        {backgroundTransitions((transitionStyle, currentScene) => (
          <animated.div
            aria-hidden="true"
            className="legacy-scene-background"
            style={{
              background: currentScene.background,
              opacity: transitionStyle.opacity,
            }}
          />
        ))}
        <div className="legacy-drag-area" data-tauri-drag-region />
        <div className="legacy-window-controls">
          <IconButton
            label="最小化"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void getCurrentWindow().minimize()}
          >
            <Minus />
          </IconButton>
          <IconButton
            label="最大化或还原"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void getCurrentWindow().toggleMaximize()}
          >
            <Maximize2 />
          </IconButton>
          <IconButton
            label="关闭"
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void invoke("hide_main_window")}
          >
            <X />
          </IconButton>
        </div>
        {viewTransitions((transitionStyle, currentScene) => (
          <animated.div
            className="legacy-page-switch"
            data-scene-key={currentScene.key}
            inert={currentScene.key !== scene.key}
            aria-hidden={currentScene.key !== scene.key}
            style={{
              transform: transitionStyle.y.to(
                (y) => `translate3d(0, ${y}%, 0)`,
              ),
            }}
          >
            <SceneOrb
              hue={currentScene.orbHue}
              offsetX={currentScene.orbOffsetX}
              offsetY={currentScene.orbOffsetY}
              active={currentScene.key === scene.key}
            />
            <div className="legacy-page-content">
              {currentScene.view === "browser" && renderBrowser()}
              {currentScene.view === "transfers" && (
                <TransferPage
                  completed={false}
                  tasks={activeTransfers}
                  error={transferError}
                  onCancel={cancelTransfer}
                  onClearCompleted={clearCompletedTransfers}
                />
              )}
              {currentScene.view === "completed" && (
                <TransferPage
                  completed
                  tasks={completedTransfers}
                  error={transferError}
                  onCancel={cancelTransfer}
                  onClearCompleted={clearCompletedTransfers}
                />
              )}
              {currentScene.view === "profiles" && <ProfilesPage />}
              {currentScene.view === "settings" && (
                <SettingsPage
                  settings={classicSettings}
                  setSettings={setClassicSettings}
                  selectDownloadDirectory={selectDownloadDirectory}
                  openDownloadDirectory={openDownloadDirectory}
                  floatWindowError={floatWindowError}
                />
              )}
            </div>
          </animated.div>
        ))}
      </main>
    </SidebarProvider>
  );
}

function createSceneVisual(key: string, view: AppView): SceneVisual {
  const hash = hashSceneKey(key);
  const hueShift = (hash % 47) - 23;
  const hue = (viewHues[view] + hueShift + 360) % 360;
  const accentHue = (hue + 4 + ((hash >>> 6) % 11)) % 360;
  const ambientX = 62 + ((hash >>> 11) % 25);
  const ambientY = 14 + ((hash >>> 17) % 24);

  return {
    accent: `hsl(${accentHue} 48% 68%)`,
    accentSoft: `hsl(${accentHue} 48% 68% / 0.17)`,
    background: `
      radial-gradient(
        circle at ${ambientX}% ${ambientY}%,
        hsl(${accentHue} 52% 58% / 0.17),
        transparent 29%
      ),
      linear-gradient(
        145deg,
        hsl(${hue} 29% 10%),
        hsl(${(hue + 8) % 360} 27% 17%) 55%,
        hsl(${(hue + 18) % 360} 19% 21%)
      )
    `,
    orbHue: accentHue,
    orbOffsetX: -72 + ((hash >>> 4) % 286),
    orbOffsetY: -62 + ((hash >>> 15) % 144),
    key,
    sidebarEnd: `hsl(${(hue + 10) % 360} 21% 18% / 0.95)`,
    sidebarStart: `hsl(${hue} 27% 12% / 0.96)`,
    view,
  };
}

function hashSceneKey(value: string) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

function installIconFont() {
  if (document.getElementById("legacy-iconfont-symbols")) return;
  const markup = iconfontSource.match(/c='(<svg>.*?<\/svg>)'/s)?.[1];
  if (!markup) return;
  const holder = document.createElement("div");
  holder.innerHTML = markup;
  const svg = holder.querySelector("svg");
  if (!svg) return;
  svg.id = "legacy-iconfont-symbols";
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  svg.style.width = "0";
  svg.style.height = "0";
  svg.style.overflow = "hidden";
  document.body.prepend(svg);
  return () => svg.remove();
}

function contentPoint(
  container: HTMLElement,
  clientX: number,
  clientY: number,
) {
  const bounds = container.getBoundingClientRect();
  return {
    x: Math.min(
      Math.max(
        clientX - bounds.left + container.scrollLeft,
        container.scrollLeft,
      ),
      container.scrollLeft + container.clientWidth,
    ),
    y: Math.min(
      Math.max(clientY - bounds.top + container.scrollTop, container.scrollTop),
      container.scrollTop + container.clientHeight,
    ),
  };
}

function createSelectionRectangle(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): SelectionRectangle {
  return {
    left: Math.min(startX, endX),
    top: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  };
}

function rectanglesOverlap(
  first: SelectionRectangle,
  second: SelectionRectangle,
) {
  return (
    first.left <= second.left + second.width &&
    first.left + first.width >= second.left &&
    first.top <= second.top + second.height &&
    first.top + first.height >= second.top
  );
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        "input, textarea, select, [contenteditable='true'], [contenteditable='']",
      ),
    )
  );
}

function createBreadcrumbs(prefix: string) {
  const names = prefix.split("/").filter(Boolean);
  return names.map((name, index) => ({
    name,
    path: `${names.slice(0, index + 1).join("/")}/`,
  }));
}

function parentPrefix(prefix: string) {
  const names = prefix.split("/").filter(Boolean);
  return names.length > 1 ? `${names.slice(0, -1).join("/")}/` : "";
}

function objectLabel(key: string, prefix: string) {
  return key.slice(prefix.length).replace(/\/$/, "") || key;
}

function fileNameFromPath(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? "";
}

function compareObjects(
  left: StorageObject,
  right: StorageObject,
  prefix: string,
  sort: ObjectSort,
) {
  if (left.isDirectory !== right.isDirectory) return left.isDirectory ? -1 : 1;
  let result = 0;
  if (sort.key === "size") {
    result = left.size - right.size;
  } else if (sort.key === "date") {
    result =
      new Date(left.updatedAt ?? 0).getTime() -
      new Date(right.updatedAt ?? 0).getTime();
  } else {
    result = objectLabel(left.key, prefix).localeCompare(
      objectLabel(right.key, prefix),
      "zh-CN",
      { numeric: true, sensitivity: "base" },
    );
  }
  return sort.direction === "asc" ? result : -result;
}

function toggleObjectSort(
  key: ObjectSort["key"],
  current: ObjectSort,
  setSort: React.Dispatch<React.SetStateAction<ObjectSort>>,
) {
  setSort({
    key,
    direction:
      current.key === key && current.direction === "asc" ? "desc" : "asc",
  });
}

function sortIndicator(sort: ObjectSort, key: ObjectSort["key"]) {
  if (sort.key !== key) return "";
  return sort.direction === "asc" ? " ↑" : " ↓";
}

function isImageObject(object: StorageObject) {
  if (object.mimeType?.startsWith("image/")) return true;
  return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(object.key);
}

function publicObjectUrl(domain: string, objectKey: string, useHttps: boolean) {
  const host = domain
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  const scheme = useHttps ? "https" : "http";
  const encodedKey = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${scheme}://${host}/${encodedKey}`;
}

function pathStyleObjectUrl(
  endpoint: string,
  bucket: string,
  objectKey: string,
) {
  const base = endpoint.trim().replace(/\/+$/, "");
  const encodedKey = objectKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `${base}/${encodeURIComponent(bucket)}/${encodedKey}`;
}

function joinLocalPath(directory: string, fileName: string) {
  const separator = directory.includes("\\") ? "\\" : "/";
  return `${directory.replace(/[\\/]+$/, "")}${separator}${fileName}`;
}

function loadObjectLayout(): ObjectLayout {
  try {
    const saved =
      window.localStorage.getItem(objectLayoutStorageKey) ??
      window.localStorage.getItem(legacyObjectLayoutStorageKey);
    return saved === "table" ? "table" : "grid";
  } catch {
    return "grid";
  }
}

let transferDoneAudio: HTMLAudioElement | undefined;

function playTransferDoneTone() {
  try {
    if (!transferDoneAudio) {
      transferDoneAudio = new Audio(transferDoneAudioSrc);
      transferDoneAudio.preload = "auto";
    }
    transferDoneAudio.currentTime = 0;
    void transferDoneAudio.play().catch(() => {});
  } catch {
    // 系统或浏览器禁用音频提示时保持安静。
  }
}

function loadClassicSettings(): ClassicSettings {
  try {
    const rawSettings =
      window.localStorage.getItem(classicSettingsStorageKey) ??
      window.localStorage.getItem(legacyClassicSettingsStorageKey);
    if (!rawSettings) return { ...defaultClassicSettings };

    const saved = JSON.parse(rawSettings) as Partial<ClassicSettings>;
    return {
      useHttps:
        typeof saved.useHttps === "boolean"
          ? saved.useHttps
          : defaultClassicSettings.useHttps,
      deleteShowDialog:
        typeof saved.deleteShowDialog === "boolean"
          ? saved.deleteShowDialog
          : defaultClassicSettings.deleteShowDialog,
      uploadOverwrite:
        typeof saved.uploadOverwrite === "boolean"
          ? saved.uploadOverwrite
          : defaultClassicSettings.uploadOverwrite,
      downloadDir:
        typeof saved.downloadDir === "string"
          ? saved.downloadDir
          : defaultClassicSettings.downloadDir,
      transferDoneTip:
        typeof saved.transferDoneTip === "boolean"
          ? saved.transferDoneTip
          : defaultClassicSettings.transferDoneTip,
      markdown:
        typeof saved.markdown === "boolean"
          ? saved.markdown
          : defaultClassicSettings.markdown,
      showFloatWindow:
        typeof saved.showFloatWindow === "boolean"
          ? saved.showFloatWindow
          : defaultClassicSettings.showFloatWindow,
      floatWindowStyle: saved.floatWindowStyle === "oval" ? "oval" : "circle",
      uploadRename:
        typeof saved.uploadRename === "boolean"
          ? saved.uploadRename
          : defaultClassicSettings.uploadRename,
    };
  } catch {
    return { ...defaultClassicSettings };
  }
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}
