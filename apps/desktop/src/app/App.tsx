import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open, save } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import transferDoneAudioSrc from "../assets/audios/tip.mp3";
import appsIcon from "../../../../renderer/assets/images/apps.png";
import backIcon from "../../../../renderer/assets/images/back.png";
import doneIcon from "../../../../renderer/assets/images/done.png";
import downloadIcon from "../../../../renderer/assets/images/download.png";
import fileIcon from "../../../../renderer/assets/images/file.png";
import gridIcon from "../../../../renderer/assets/images/grid.png";
import reloadIcon from "../../../../renderer/assets/images/reload.png";
import searchIcon from "../../../../renderer/assets/images/search.png";
import settingIcon from "../../../../renderer/assets/images/setting.png";
import tableIcon from "../../../../renderer/assets/images/table.png";
import iconfontSource from "../../../../renderer/assets/iconfont.js?raw";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useBuckets, type Bucket } from "../features/buckets/use-buckets";
import { useDomains } from "../features/buckets/use-domains";
import {
  useObjects,
  type ObjectPage,
  type StorageObject,
} from "../features/objects/use-objects";
import { useProfiles, type Profile } from "../features/profiles/use-profiles";
import {
  useTransfers,
  type TransferTask,
} from "../features/transfers/use-transfers";
import { apiRequest } from "../lib/backend/client";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/app-store";

type View = "browser" | "transfers" | "completed" | "profiles" | "settings";
type ObjectLayout = "grid" | "table";
type ObjectSort = { key: "name" | "size" | "date"; direction: "asc" | "desc" };
type ExpandedUploadFile = { localPath: string; relativePath: string };
type PageDirection = "up" | "down";
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
type ClassicSettings = {
  useHttps: boolean;
  deleteShowDialog: boolean;
  uploadOverwrite: boolean;
  downloadDir: string;
  transferDoneTip: boolean;
  markdown: boolean;
  showFloatWindow: boolean;
  floatWindowStyle: "circle" | "oval";
  uploadRename: boolean;
};

const classicSettingsStorageKey = "oss-client:classic-settings";
const objectLayoutStorageKey = "oss-client:object-layout";
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

const themes = [
  {
    app: "linear-gradient(#8B5C68, #37394E)",
    aside: "linear-gradient(#8B5C68, #484B58)",
  },
  {
    app: "linear-gradient(#875D56, #3A3B4E)",
    aside: "linear-gradient(#875D56, #484B58)",
  },
  {
    app: "linear-gradient(#546F67, #333B4E)",
    aside: "linear-gradient(#546F67, #484B58)",
  },
  {
    app: "linear-gradient(#7D5A86, #39394E)",
    aside: "linear-gradient(#7D5A86, #484B58)",
  },
  {
    app: "linear-gradient(#80865A, #39394E)",
    aside: "linear-gradient(#80865A, #484B58)",
  },
];

const viewOrder: Record<View, number> = {
  browser: 0,
  transfers: 1,
  completed: 2,
  settings: 3,
  profiles: 4,
};

export function App() {
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
  const [activeView, setActiveView] = useState<View>("browser");
  const [pageDirection, setPageDirection] = useState<PageDirection>("down");
  const [hasNavigated, setHasNavigated] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string>();
  const [editingUploadBucket, setEditingUploadBucket] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [provider, setProvider] = useState("qiniu");
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
  const breadcrumbs = createBreadcrumbs(prefix);
  const theme = useMemo(
    () => themes[Math.floor(Math.random() * themes.length)],
    [activeView],
  );
  const backgroundPosition = useMemo(
    () =>
      `${Math.ceil((Math.random() - 0.5) * 800)}px ${Math.ceil(
        (Math.random() - 0.5) * 600,
      )}px`,
    [activeView],
  );
  const activeProfile = profiles.data?.find(
    (profile) => profile.id === activeProfileId,
  );
  const editingProfile = profiles.data?.find(
    (profile) => profile.id === editingProfileId,
  );
  const profileDomains = useDomains(editingProfile?.id, editingUploadBucket);
  const profileDomainOptions = [
    ...new Set(
      [editingProfile?.defaultDomain, ...(profileDomains.data ?? [])].filter(
        (domain): domain is string => Boolean(domain),
      ),
    ),
  ];

  function navigate(nextView: View) {
    if (nextView === activeView) return;
    setPageDirection(
      viewOrder[nextView] < viewOrder[activeView] ? "down" : "up",
    );
    setHasNavigated(true);
    setActiveView(nextView);
  }

  const visibleObjects = useMemo(() => {
    const query = searchValue.trim().toLocaleLowerCase();
    const filtered = query
      ? (objects.items ?? []).filter((object) =>
          objectLabel(object.key, prefix).toLocaleLowerCase().includes(query),
        )
      : [...(objects.items ?? [])];
    return filtered.sort((left, right) =>
      compareObjects(left, right, prefix, objectSort),
    );
  }, [objectSort, objects.items, prefix, searchValue]);

  const selectedObjects = visibleObjects.filter((object) =>
    selectedObjectKeys.has(object.key),
  );
  const selectedObject =
    selectedObjects.length === 1 ? selectedObjects[0] : undefined;
  const activeTransfers = (transfers.data ?? []).filter(
    (task) => task.status === "queued" || task.status === "running",
  );
  const completedTransfers = (transfers.data ?? []).filter(
    (task) => task.status !== "queued" && task.status !== "running",
  );
  const runningTransfers = activeTransfers.filter(
    (task) => task.status === "queued" || task.status === "running",
  );

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
      setPageDirection("up");
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
    window.localStorage.setItem(
      classicSettingsStorageKey,
      JSON.stringify(classicSettings),
    );
  }, [classicSettings]);

  useEffect(() => {
    window.localStorage.setItem(objectLayoutStorageKey, layout);
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
      setPageDirection("up");
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

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = form.get(name);
      return typeof value === "string" ? value : "";
    };
    setSubmitting(true);
    setFormError(undefined);

    try {
      const accessKeyId = field("accessKeyId");
      const accessKeySecret = field("accessKeySecret");
      const body: Record<string, unknown> = {
        name: field("name"),
        provider,
        region: field("region"),
        endpoint: field("endpoint"),
        uploadBucket: field("uploadBucket"),
        uploadPrefix: field("uploadPrefix"),
        defaultDomain: field("defaultDomain"),
      };
      if (!editingProfile || accessKeyId || accessKeySecret) {
        body.credentials = { accessKeyId, accessKeySecret };
      }
      const profile = await apiRequest<Profile>(
        editingProfile
          ? `/api/v1/profiles/${editingProfile.id}`
          : "/api/v1/profiles",
        {
          method: editingProfile ? "PATCH" : "POST",
          body: JSON.stringify(body),
        },
      );
      await profiles.mutate();
      setActiveProfileId(profile.id);
      setShowProfileForm(false);
      setEditingProfileId(undefined);
      setEditingUploadBucket("");
      setProvider("qiniu");
      if (!editingProfile) navigate("browser");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSubmitting(false);
    }
  }

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

  async function deleteActiveProfile() {
    if (!activeProfile) return;
    if (!window.confirm("确定要删除该应用吗？")) return;

    setSubmitting(true);
    try {
      await apiRequest(`/api/v1/profiles/${activeProfile.id}`, {
        method: "DELETE",
      });
      const nextProfile = profiles.data?.find(
        (profile) => profile.id !== activeProfile.id,
      );
      setActiveProfileId(nextProfile?.id);
      setShowProfileForm(false);
      await profiles.mutate();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "删除失败");
    } finally {
      setSubmitting(false);
    }
  }

  function openBucket(bucket: Bucket) {
    setActiveBucket(bucket);
    navigate("browser");
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
            className="legacy-button"
            disabled={!activeBucket}
            onClick={() => void uploadFiles()}
          >
            <AntIcon name="upload" />
            上传文件
          </Button>
          <Button
            size="sm"
            className="legacy-button"
            disabled={selectedObjects.length === 0}
            onClick={() => void downloadSelectedObjects()}
          >
            下载
          </Button>
          <Button
            size="sm"
            className="legacy-button"
            disabled={
              !selectedObject ||
              selectedObject.isDirectory ||
              !activeProfile?.defaultDomain
            }
            onClick={() => void copySelectedObjectAddress()}
          >
            复制地址
          </Button>
          <Button size="sm" className="legacy-button" disabled>
            删除
          </Button>
        </div>

        <div className="legacy-browser-toolbar">
          <div className="legacy-breadcrumbs">
            <button
              type="button"
              className="legacy-icon-button"
              disabled={!prefix}
              onClick={() => setPrefix(parentPrefix(prefix))}
              aria-label="返回上一级"
            >
              <img className="legacy-back-icon" src={backIcon} alt="" />
            </button>
            <button
              type="button"
              className="legacy-icon-button"
              onClick={() => void objects.mutate()}
              aria-label="刷新文件"
            >
              <img className="legacy-reload-icon" src={reloadIcon} alt="" />
            </button>
            <button
              type="button"
              className="legacy-crumb"
              onClick={() => setPrefix("")}
            >
              首页
            </button>
            {breadcrumbs.map((item) => (
              <span key={item.path} className="legacy-crumb-part">
                <span className="legacy-crumb-separator">/</span>
                <button
                  type="button"
                  className="legacy-crumb"
                  onClick={() => setPrefix(item.path)}
                >
                  {item.name}
                </button>
              </span>
            ))}
          </div>
          <div className="legacy-browser-actions">
            <label className="legacy-search">
              <img src={searchIcon} alt="" />
              <input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  clearObjectSelection();
                }}
                placeholder="搜索文件"
              />
            </label>
            <button
              type="button"
              className="legacy-icon-button"
              onClick={() => {
                setLayout(layout === "grid" ? "table" : "grid");
                clearObjectSelection();
              }}
              aria-label={layout === "grid" ? "切换到列表" : "切换到网格"}
            >
              <img
                className="legacy-layout-icon"
                src={layout === "grid" ? gridIcon : tableIcon}
                alt=""
              />
            </button>
          </div>
        </div>

        {transferError && <div className="legacy-error">{transferError}</div>}

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
            <EmptyState
              title="读取失败"
              subtitle={
                objects.error instanceof Error
                  ? objects.error.message
                  : "无法读取当前目录"
              }
            />
          ) : !activeBucket ? (
            <EmptyState
              title="没有 Bucket"
              subtitle={
                activeProfileId ? "当前没有选中的存储桶" : "请先添加云账号"
              }
            />
          ) : objects.isLoading ? (
            <EmptyState title="正在读取" subtitle="正在获取当前目录中的文件" />
          ) : visibleObjects.length === 0 ? (
            <EmptyState
              title={searchValue ? "没有搜索结果" : "没有文件"}
              subtitle={
                searchValue
                  ? "当前目录没有匹配的文件"
                  : "当前 Bucket 中没有文件"
              }
            />
          ) : layout === "grid" ? (
            <div className="legacy-file-grid">
              {visibleObjects.map((object) => (
                <button
                  type="button"
                  key={`${object.isDirectory ? "d" : "f"}:${object.key}`}
                  data-object-key={object.key}
                  className={cn(
                    "legacy-file-cell",
                    selectedObjectKeys.has(object.key) && "is-selected",
                  )}
                  aria-selected={selectedObjectKeys.has(object.key)}
                  onClick={(event) => selectObject(event, object.key)}
                  onDoubleClick={() =>
                    object.isDirectory && setPrefix(object.key)
                  }
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
                </button>
              ))}
            </div>
          ) : (
            <div className="legacy-file-table" role="table">
              <div className="legacy-file-row legacy-file-head" role="row">
                <button
                  type="button"
                  onClick={() =>
                    toggleObjectSort("name", objectSort, setObjectSort)
                  }
                >
                  文件名{sortIndicator(objectSort, "name")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleObjectSort("size", objectSort, setObjectSort)
                  }
                >
                  大小{sortIndicator(objectSort, "size")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toggleObjectSort("date", objectSort, setObjectSort)
                  }
                >
                  修改日期{sortIndicator(objectSort, "date")}
                </button>
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
                  onDoubleClick={() =>
                    object.isDirectory && setPrefix(object.key)
                  }
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
          <span>{activeProfile?.defaultDomain || "没有绑定域名"}</span>
        </footer>
      </section>
    );
  }

  function renderTransferPage(completed: boolean) {
    const tasks = completed ? completedTransfers : activeTransfers;
    return (
      <section className="legacy-page legacy-transfer-page">
        {transferError && <div className="legacy-error">{transferError}</div>}
        {tasks.length ? (
          <>
            <div className="legacy-transfer-toolbar">
              <span>总共 {tasks.length} 项</span>
              {completed && (
                <Button
                  size="sm"
                  className="legacy-button"
                  onClick={() => void clearCompletedTransfers()}
                >
                  清空记录
                </Button>
              )}
            </div>
            <div className="legacy-transfer-table">
              {tasks.map((task) => (
                <div
                  className={cn(
                    "legacy-transfer-row",
                    completed && "is-completed",
                  )}
                  key={task.id}
                >
                  <div className="legacy-transfer-meta">
                    <IconFont
                      type={fileIconName(task.fileName)}
                      className="legacy-transfer-file-icon"
                    />
                    <div>
                      <div className="legacy-transfer-name">
                        {task.fileName}
                      </div>
                      <div className="legacy-transfer-size">
                        {formatBytes(task.total || task.transferred)}
                      </div>
                    </div>
                  </div>
                  {completed ? (
                    <>
                      <span className="legacy-transfer-done-type">
                        {task.direction === "upload" ? "上传" : "下载"}
                      </span>
                      <span className="legacy-transfer-date">
                        {formatDate(task.updatedAt)}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="legacy-transfer-progress">
                        <div className="legacy-progress-track">
                          <div
                            className={cn(
                              "legacy-progress-value",
                              task.status === "failed" && "is-failed",
                            )}
                            style={{ width: `${transferProgress(task)}%` }}
                          />
                        </div>
                        <span>{transferProgress(task).toFixed(0)}%</span>
                      </div>
                      <span className="legacy-transfer-direction">
                        {task.direction === "upload" ? (
                          <AntIcon name="upload" />
                        ) : (
                          <AntIcon name="download" />
                        )}
                      </span>
                      <span className="legacy-transfer-action">
                        {(task.status === "queued" ||
                          task.status === "running") && (
                          <button
                            type="button"
                            className="legacy-icon-button"
                            onClick={() => void cancelTransfer(task.id)}
                            aria-label={`取消 ${task.fileName}`}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                      </span>
                    </>
                  )}
                  {task.error && (
                    <p className="legacy-task-error">{task.error}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState title="没有文件" subtitle="没有找到传输列表" />
        )}
      </section>
    );
  }

  function renderProfiles() {
    if (!profiles.data?.length && !showProfileForm) {
      return (
        <section className="legacy-page legacy-profiles-empty">
          <EmptyState title="没有 Apps" subtitle="暂时没有搜索到 apps">
            <Button
              size="sm"
              className="legacy-button"
              onClick={() => {
                setShowProfileForm(true);
                setEditingProfileId(undefined);
                setEditingUploadBucket("");
                setProvider("qiniu");
                setFormError(undefined);
              }}
            >
              添加
            </Button>
          </EmptyState>
        </section>
      );
    }

    return (
      <section className="legacy-page legacy-profiles-page">
        <div className="legacy-profile-list-pane">
          <div className="legacy-profile-pane-header">
            <Button
              size="sm"
              className="legacy-button"
              onClick={() => {
                if (showProfileForm) {
                  setShowProfileForm(false);
                } else {
                  setShowProfileForm(true);
                  setEditingProfileId(undefined);
                  setEditingUploadBucket("");
                  setProvider("qiniu");
                }
                setFormError(undefined);
              }}
            >
              {showProfileForm ? "返回" : "添加"}
            </Button>
          </div>
          <div className="legacy-profile-list">
            {profiles.data?.map((profile) => (
              <button
                type="button"
                key={profile.id}
                className={cn(
                  "legacy-profile-item",
                  profile.id === activeProfileId && "is-active",
                )}
                onClick={() => {
                  setActiveProfileId(profile.id);
                  setShowProfileForm(false);
                  setEditingProfileId(undefined);
                  setEditingUploadBucket("");
                }}
              >
                <ProviderIcon provider={profile.provider} />
                <span>{profile.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="legacy-profile-detail">
          {showProfileForm || !activeProfile ? (
            <>
              <h1>{editingProfile ? "编辑配置" : "新增配置"}</h1>
              <form
                key={editingProfile?.id ?? "new-profile"}
                className="legacy-profile-form"
                onSubmit={saveProfile}
              >
                <label>
                  <span>名称</span>
                  <Input
                    className="legacy-input"
                    name="name"
                    placeholder="生产环境"
                    defaultValue={editingProfile?.name}
                    required
                  />
                </label>
                <label>
                  <span>类型</span>
                  <select
                    name="provider"
                    className="legacy-input"
                    value={provider}
                    onChange={(event) => setProvider(event.target.value)}
                  >
                    <option value="qiniu">七牛云</option>
                    <option value="aliyun">阿里云 OSS</option>
                    <option value="tencent">腾讯云 COS</option>
                    <option value="rustfs">RustFS</option>
                    <option value="s3">S3 兼容存储</option>
                  </select>
                </label>
                {isS3CompatibleProvider(provider) && (
                  <label>
                    <span>Endpoint</span>
                    <Input
                      key={`${provider}-endpoint`}
                      className="legacy-input"
                      name="endpoint"
                      placeholder="例如 http://localhost:9000"
                      type="url"
                      autoComplete="off"
                      defaultValue={editingProfile?.endpoint}
                      required
                    />
                  </label>
                )}
                {provider !== "qiniu" && (
                  <label>
                    <span>Region</span>
                    <Input
                      key={`${provider}-region`}
                      className="legacy-input"
                      name="region"
                      placeholder={
                        provider === "aliyun"
                          ? "例如 cn-hangzhou"
                          : provider === "tencent"
                            ? "例如 ap-guangzhou"
                            : "例如 us-east-1"
                      }
                      defaultValue={
                        editingProfile?.region ||
                        (isS3CompatibleProvider(provider)
                          ? "us-east-1"
                          : undefined)
                      }
                      autoComplete="off"
                      required
                    />
                  </label>
                )}
                <label>
                  <span>AK</span>
                  <Input
                    className="legacy-input"
                    name="accessKeyId"
                    autoComplete="off"
                    placeholder={editingProfile?.accessKeyHint}
                    required={!editingProfile}
                  />
                </label>
                <label>
                  <span>SK</span>
                  <Input
                    className="legacy-input"
                    name="accessKeySecret"
                    type="password"
                    autoComplete="new-password"
                    placeholder={editingProfile ? "留空则保持不变" : undefined}
                    required={!editingProfile}
                  />
                </label>
                <label>
                  <span>默认 Bucket</span>
                  {editingProfile && buckets.data?.length ? (
                    <select
                      className="legacy-input"
                      name="uploadBucket"
                      value={editingUploadBucket}
                      onChange={(event) =>
                        setEditingUploadBucket(event.target.value)
                      }
                    >
                      <option value="">不设置</option>
                      {buckets.data.map((bucket) => (
                        <option key={bucket.name} value={bucket.name}>
                          {bucket.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="legacy-input"
                      name="uploadBucket"
                      defaultValue={editingProfile?.uploadBucket}
                      placeholder="可选"
                      autoComplete="off"
                    />
                  )}
                </label>
                <label>
                  <span>默认上传前缀</span>
                  <Input
                    className="legacy-input"
                    name="uploadPrefix"
                    defaultValue={editingProfile?.uploadPrefix}
                    placeholder="例如 images/"
                    autoComplete="off"
                  />
                </label>
                <label>
                  <span>默认域名</span>
                  {profileDomainOptions.length ? (
                    <select
                      className="legacy-input"
                      name="defaultDomain"
                      defaultValue={editingProfile?.defaultDomain}
                    >
                      <option value="">不设置</option>
                      {profileDomainOptions.map((domain) => (
                        <option key={domain} value={domain}>
                          {domain}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      className="legacy-input"
                      name="defaultDomain"
                      defaultValue={editingProfile?.defaultDomain}
                      placeholder="例如 https://cdn.example.com"
                      autoComplete="off"
                    />
                  )}
                </label>
                {formError && <p className="legacy-form-error">{formError}</p>}
                <div className="legacy-form-actions">
                  {(activeProfile || editingProfile) && (
                    <Button
                      type="button"
                      size="sm"
                      className="legacy-button"
                      onClick={() => {
                        setShowProfileForm(false);
                        setEditingProfileId(undefined);
                        setEditingUploadBucket("");
                      }}
                    >
                      取消
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    className="legacy-button"
                    disabled={submitting}
                  >
                    {submitting ? "保存中…" : "确定"}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="legacy-profile-description">
              <h1>查看配置</h1>
              <ProfileSection title="基本信息：">
                <Description
                  label="云服务厂商"
                  value={providerName(activeProfile.provider)}
                />
                <Description label="AK" value={activeProfile.accessKeyHint} />
                <Description label="SK" value={"*".repeat(40)} />
                {activeProfile.endpoint && (
                  <Description
                    label="Endpoint"
                    value={activeProfile.endpoint}
                  />
                )}
                {activeProfile.region && (
                  <Description label="Region" value={activeProfile.region} />
                )}
              </ProfileSection>
              <ProfileSection title="软件配置：">
                <Description
                  label="默认上传路径"
                  value={activeProfile.uploadBucket || "暂无配置"}
                />
                <Description
                  label="默认上传前缀"
                  value={activeProfile.uploadPrefix || "暂无配置"}
                />
                <Description
                  label="默认域名"
                  value={activeProfile.defaultDomain || "暂无配置"}
                />
              </ProfileSection>
              <ProfileSection title="操作">
                <Button
                  size="sm"
                  className="legacy-button legacy-profile-operation"
                  onClick={() => {
                    setEditingProfileId(activeProfile.id);
                    setEditingUploadBucket(activeProfile.uploadBucket);
                    setProvider(activeProfile.provider);
                    setShowProfileForm(true);
                    setFormError(undefined);
                  }}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  className="legacy-button legacy-profile-operation legacy-danger"
                  disabled={submitting}
                  onClick={() => void deleteActiveProfile()}
                >
                  删除
                </Button>
              </ProfileSection>
            </div>
          )}
        </div>
      </section>
    );
  }

  const shellStyle = {
    "--legacy-app-gradient": theme.app,
    "--legacy-aside-gradient": theme.aside,
  } as CSSProperties;

  return (
    <div className="legacy-app" style={shellStyle}>
      <aside className="legacy-sidebar">
        <div className="legacy-title-bar" data-tauri-drag-region>
          <span data-tauri-drag-region>OSS Client</span>
        </div>

        <nav className="legacy-sidebar-scroll">
          <SidebarSection
            title="储存空间"
            loading={Boolean(activeProfileId && buckets.isLoading)}
          >
            {buckets.data?.length ? (
              buckets.data.map((bucket) => (
                <SidebarItem
                  key={`${bucket.name}:${bucket.region ?? ""}`}
                  active={
                    activeView === "browser" &&
                    activeBucket?.name === bucket.name
                  }
                  icon={<img src={fileIcon} alt="" />}
                  label={bucket.name}
                  onClick={() => openBucket(bucket)}
                />
              ))
            ) : (
              <SidebarItem
                disabled
                icon={<img src={fileIcon} alt="" />}
                label="暂无储存桶"
              />
            )}
          </SidebarSection>

          <SidebarSection
            title="传输列表"
            loading={runningTransfers.length > 0}
          >
            <SidebarItem
              active={activeView === "transfers"}
              icon={<img src={downloadIcon} alt="" />}
              label="传输列表"
              onClick={() => navigate("transfers")}
            />
            <SidebarItem
              active={activeView === "completed"}
              icon={<img src={doneIcon} alt="" />}
              label="传输完成"
              onClick={() => navigate("completed")}
            />
          </SidebarSection>

          <SidebarSection title="设置">
            <SidebarItem
              active={activeView === "settings"}
              icon={<img src={settingIcon} alt="" />}
              label="设置"
              onClick={() => navigate("settings")}
            />
            <SidebarItem
              active={activeView === "profiles"}
              icon={<img src={appsIcon} alt="" />}
              label="apps"
              onClick={() => navigate("profiles")}
            />
          </SidebarSection>
        </nav>
      </aside>

      <main className="legacy-main">
        <div className="legacy-drag-area" data-tauri-drag-region />
        <div className="legacy-window-controls">
          <button
            type="button"
            onClick={() => void getCurrentWindow().minimize()}
            aria-label="最小化"
          >
            <AntIcon name="minus-circle" />
          </button>
          <button
            type="button"
            onClick={() => void getCurrentWindow().toggleMaximize()}
            aria-label="最大化或还原"
          >
            <AntIcon name="plus-circle" />
          </button>
          <button
            type="button"
            onClick={() => void invoke("hide_main_window")}
            aria-label="关闭"
          >
            <AntIcon name="close-circle" />
          </button>
        </div>
        <div
          key={activeView}
          className={cn(
            "legacy-page-switch",
            hasNavigated && `is-${pageDirection}`,
          )}
          style={{ backgroundPosition }}
        >
          {activeView === "browser" && renderBrowser()}
          {activeView === "transfers" && renderTransferPage(false)}
          {activeView === "completed" && renderTransferPage(true)}
          {activeView === "profiles" && renderProfiles()}
          {activeView === "settings" &&
            renderSettings(
              classicSettings,
              setClassicSettings,
              selectDownloadDirectory,
              openDownloadDirectory,
              floatWindowError,
            )}
        </div>
      </main>
    </div>
  );
}

function SidebarSection({
  title,
  loading,
  children,
}: {
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="legacy-sidebar-section">
      <div className="legacy-sidebar-heading">
        <span>{title}</span>
        {loading && <span className="legacy-spinner" />}
      </div>
      <div className="legacy-sidebar-list">{children}</div>
    </section>
  );
}

function renderSettings(
  settings: ClassicSettings,
  setSettings: React.Dispatch<React.SetStateAction<ClassicSettings>>,
  selectDownloadDirectory: () => Promise<void>,
  openDownloadDirectory: () => Promise<void>,
  floatWindowError?: string,
) {
  const update = <Key extends keyof ClassicSettings>(
    key: Key,
    value: ClassicSettings[Key],
  ) => setSettings((current) => ({ ...current, [key]: value }));

  return (
    <section className="legacy-page legacy-setting-wrapper">
      <section className="legacy-setting-section">
        <div className="legacy-setting-title">全局设置</div>
        <SettingRow label="使用 https ">
          <ClassicSwitch
            checked={settings.useHttps}
            onChange={(checked) => update("useHttps", checked)}
          />
        </SettingRow>
        <SettingRow label="删除时显示提示框">
          <ClassicSwitch
            checked={settings.deleteShowDialog}
            onChange={(checked) => update("deleteShowDialog", checked)}
          />
        </SettingRow>
        <SettingRow label="如果文件已经存在是否覆盖文件">
          <ClassicSwitch
            checked={settings.uploadOverwrite}
            onChange={(checked) => update("uploadOverwrite", checked)}
          />
        </SettingRow>
        <SettingRow
          label={
            <Button
              size="sm"
              className="legacy-button"
              onClick={() => void selectDownloadDirectory()}
            >
              选择下载位置
            </Button>
          }
        >
          <div className="legacy-setting-path-group">
            <input
              className="legacy-setting-path"
              disabled
              placeholder="请选择默认下载位置"
              value={settings.downloadDir}
            />
            <button
              type="button"
              aria-label="打开下载位置"
              disabled={!settings.downloadDir}
              onClick={() => void openDownloadDirectory()}
            >
              <AntIcon name="select" />
            </button>
          </div>
        </SettingRow>
      </section>

      <section className="legacy-setting-section">
        <div className="legacy-setting-title">托盘设置</div>
        <SettingRow label="传输完成后是否提示">
          <ClassicSwitch
            checked={settings.transferDoneTip}
            onChange={(checked) => update("transferDoneTip", checked)}
          />
        </SettingRow>
        <SettingRow label="复制url或者markdown格式">
          <ClassicSwitch
            checked={settings.markdown}
            onChange={(checked) => update("markdown", checked)}
          />
        </SettingRow>
      </section>

      <section className="legacy-setting-section">
        <div className="legacy-setting-title">悬浮窗设置</div>
        {floatWindowError && (
          <div className="legacy-float-setting-error">{floatWindowError}</div>
        )}
        <SettingRow label="是否显示悬浮窗">
          <ClassicSwitch
            checked={settings.showFloatWindow}
            onChange={(checked) => update("showFloatWindow", checked)}
          />
        </SettingRow>
        <SettingRow label="悬浮窗样式">
          <div className="legacy-radio-group">
            <label>
              <input
                type="radio"
                name="float-window-style"
                checked={settings.floatWindowStyle === "circle"}
                onChange={() => update("floatWindowStyle", "circle")}
              />
              圆形
            </label>
            <label>
              <input
                type="radio"
                name="float-window-style"
                checked={settings.floatWindowStyle === "oval"}
                onChange={() => update("floatWindowStyle", "oval")}
              />
              椭圆形
            </label>
          </div>
        </SettingRow>
        <SettingRow label="上传时是否重命名">
          <ClassicSwitch
            checked={settings.uploadRename}
            onChange={(checked) => update("uploadRename", checked)}
          />
        </SettingRow>
      </section>
    </section>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="legacy-setting-row">
      <div>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function ClassicSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn("legacy-switch", checked && "is-checked")}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function IconFont({ type, className }: { type: string; className?: string }) {
  return (
    <svg className={cn("legacy-iconfont", className)} aria-hidden="true">
      <use href={`#${type}`} />
    </svg>
  );
}

type AntIconName =
  | "upload"
  | "download"
  | "select"
  | "minus-circle"
  | "plus-circle"
  | "close-circle";

function AntIcon({ name }: { name: AntIconName }) {
  const paths: Record<AntIconName, string> = {
    upload:
      "M400 317.7h73.9V656c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V317.7H624c6.7 0 10.4-7.7 6.3-12.9L518.3 163a8 8 0 0 0-12.6 0l-112 141.7c-4.1 5.3-.4 13 6.3 13zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z",
    download:
      "M505.7 661a8 8 0 0 0 12.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9h-74.1V168c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v338.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.8zM878 626h-60c-4.4 0-8 3.6-8 8v154H214V634c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v198c0 17.7 14.3 32 32 32h684c17.7 0 32-14.3 32-32V634c0-4.4-3.6-8-8-8z",
    select:
      "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h360c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8H184V184h656v320c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V144c0-17.7-14.3-32-32-32zM653.3 599.4l52.2-52.2a8.01 8.01 0 0 0-4.7-13.6l-179.4-21c-5.1-.6-9.5 3.7-8.9 8.9l21 179.4c.8 6.6 8.9 9.4 13.6 4.7l52.4-52.4 256.2 256.2c3.1 3.1 8.2 3.1 11.3 0l42.4-42.4c3.1-3.1 3.1-8.2 0-11.3L653.3 599.4z",
    "minus-circle":
      "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h368c4.4 0 8 3.6 8 8v48z",
    "plus-circle":
      "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm192 472c0 4.4-3.6 8-8 8H544v152c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V544H328c-4.4 0-8-3.6-8-8v-48c0-4.4 3.6-8 8-8h152V328c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v152h152c4.4 0 8 3.6 8 8v48z",
    "close-circle":
      "M512 64c247.4 0 448 200.6 448 448S759.4 960 512 960 64 759.4 64 512 264.6 64 512 64Zm127.978 274.82-.034.006c-.023.007-.042.018-.083.059L512 466.745l-127.86-127.86c-.042-.041-.06-.052-.084-.059a.118.118 0 0 0-.07 0c-.022.007-.041.018-.082.059l-45.02 45.019c-.04.04-.05.06-.058.083a.118.118 0 0 0 0 .07l.01.022a.268.268 0 0 0 .049.06L466.745 512l-127.86 127.862c-.041.04-.052.06-.059.083a.118.118 0 0 0 0 .07c.007.022.018.041.059.082l45.019 45.02c.04.04.06.05.083.058a.118.118 0 0 0 .07 0c.022-.007.041-.018.082-.059L512 557.254l127.862 127.861c.04.041.06.052.083.059a.118.118 0 0 0 .07 0c.022-.007.041-.018.082-.059l45.02-45.019c.04-.04.05-.06.058-.083a.118.118 0 0 0 0-.07l-.01-.022a.268.268 0 0 0-.049-.06L557.254 512l127.861-127.86c.041-.042.052-.06.059-.084a.118.118 0 0 0 0-.07c-.007-.022-.018-.041-.059-.082l-45.019-45.02c-.04-.04-.06-.05-.083-.058a.118.118 0 0 0-.07 0Z",
  };

  return (
    <svg className="legacy-ant-icon" viewBox="0 0 1024 1024" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
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

function SidebarItem({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "legacy-sidebar-item",
        active && "is-active",
        disabled && "is-disabled",
      )}
      onClick={onClick}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function EmptyState({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="legacy-empty">
      <div className="legacy-empty-title">{title}</div>
      <div className="legacy-empty-subtitle">{subtitle}</div>
      {children && <div className="legacy-empty-actions">{children}</div>}
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (isS3CompatibleProvider(provider)) {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#f07b4f"
          d="M12 3c4.42 0 8 1.34 8 3s-3.58 3-8 3-8-1.34-8-3 3.58-3 8-3Zm-8 6.1C5.72 10.3 8.73 11 12 11s6.28-.7 8-1.9V13c0 1.66-3.58 3-8 3s-8-1.34-8-3V9.1Zm0 7C5.72 17.3 8.73 18 12 18s6.28-.7 8-1.9V18c0 1.66-3.58 3-8 3s-8-1.34-8-3v-1.9Z"
        />
      </svg>
    );
  }

  if (provider === "aliyun") {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#ff6a00"
          d="M14.752 4.64h5.274C22.242 4.64 24 6.475 24 8.691V15.8a3.947 3.947 0 0 1-3.974 3.975h-5.274l1.299-1.835 3.822-1.222c.688-.23 1.146-.918 1.146-1.605v-5.81c0-.687-.458-1.375-1.146-1.605L16.05 6.475l-1.3-1.835ZM2.98 15.111c0 .688.46 1.376 1.147 1.606l3.822 1.146 1.3 1.835H3.974A3.947 3.947 0 0 1 0 15.723V8.69c0-2.216 1.758-4.05 3.975-4.05h5.273L7.95 6.474 4.127 7.697c-.688.23-1.146.918-1.146 1.606v5.808Zm13.071-3.898H8.025v1.835h8.026v-1.835Z"
        />
      </svg>
    );
  }

  if (provider === "tencent") {
    return (
      <svg
        className="legacy-provider-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="#00a3ff"
          d="M20.048 17.142c-.354.35-1.061.874-2.3.874h-7.605l4.422-4.198c.177-.175.62-.612 1.061-.962.885-.787 1.592-.874 2.211-.874.885 0 1.592.35 2.211.874 1.238 1.137 1.238 3.149 0 4.286Zm1.504-5.685c-.885-.962-2.211-1.574-3.626-1.574-1.239 0-2.3.437-3.273 1.137-.353.35-.884.7-1.326 1.224-.354.35-7.96 7.696-7.96 7.696.442.088.973.088 1.415.088h9.64c.708 0 1.238 0 1.769-.088 1.15-.087 2.3-.524 3.272-1.399 2.035-1.924 2.035-5.16.089-7.084Z"
        />
        <path
          fill="#00c8dc"
          d="M9.17 10.932c-.973-.7-1.946-1.05-3.095-1.05-1.415 0-2.742.613-3.626 1.575-1.946 2.011-1.946 5.16.088 7.171.884.787 1.769 1.224 2.83 1.312l2.034-1.924c-.353 0-.796 0-1.15-.088-1.149 0-1.856-.35-2.299-.786-1.238-1.225-1.238-3.149-.088-4.373.619-.612 1.327-.875 2.211-.875.53 0 1.327.088 2.122.875.354.35 1.327 1.05 1.68 1.399h.089l1.327-1.312v-.087c-.62-.612-1.592-1.4-2.123-1.837Z"
        />
        <path
          fill="#006eff"
          d="M18.456 8.745C17.484 6.122 14.919 4.285 12 4.285c-3.449 0-6.19 2.536-6.721 5.685.265 0 .53-.088.884-.088s.796.088 1.15.088C7.755 7.783 9.701 6.21 12 6.21c1.946 0 3.626 1.137 4.422 2.799 0 0 .089.087.089 0 .619-.088 1.326-.263 1.945-.263Z"
        />
      </svg>
    );
  }

  return (
    <svg
      className="legacy-provider-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#06aeef"
        d="M23.111 4.6a.914.914 0 0 0-.861.161A13.443 13.443 0 0 1 7.947 8.897L7.38 6.831a1.076 1.076 0 0 0-1.211-.698l.27 2.18c-1.816-.827-2.313-.946-3.587-2.45C2.674 5.729 1.263 4.472.89 4.6a11.906 11.906 0 0 0 5.892 6.497l.738 5.97s.33 2.286 2.473 2.286h4.586c2.144 0 2.474-2.286 2.474-2.286l.518-4.28c-1.393-.11-2.268.857-2.546 1.814-.465 1.614-.465 1.716-.557 1.998-.188.575-.806.644-.806.644h-2.753s-.617-.07-.806-.644c-.12-.371-.727-2.54-1.335-4.74A11.877 11.877 0 0 0 23.11 4.599Z"
      />
    </svg>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="legacy-description-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function Description({ label, value }: { label: string; value: string }) {
  return (
    <p className="legacy-description-row">
      <span>{label}：</span>
      <strong>{value}</strong>
    </p>
  );
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

function fileIconName(filename: string) {
  const extension = filename.split(".").at(-1)?.toLowerCase();
  const icons: Record<string, string> = {
    ai: "icon-ai",
    apk: "icon-apk",
    avi: "icon-avi",
    css: "icon-css",
    scss: "icon-css",
    less: "icon-css",
    dmg: "icon-dmg",
    doc: "icon-doc",
    docx: "icon-doc",
    exe: "icon-exe",
    flv: "icon-flv",
    gif: "icon-gif",
    html: "icon-html",
    iso: "icon-iso",
    jpg: "icon-jpg",
    jpeg: "icon-jpg",
    js: "icon-js",
    jsx: "icon-js",
    ts: "icon-js",
    tsx: "icon-js",
    log: "icon-log",
    mov: "icon-mov",
    mp3: "icon-mp3",
    otf: "icon-otf",
    pdf: "icon-pdf",
    php: "icon-php",
    png: "icon-png",
    ppt: "icon-ppt",
    pptx: "icon-ppt",
    psd: "icon-psd",
    sketch: "icon-sketch",
    sql: "icon-sql",
    wav: "icon-wav",
    xls: "icon-xls",
    xlsx: "icon-xls",
    zip: "icon-zip",
  };
  return extension ? (icons[extension] ?? "icon-documents") : "icon-documents";
}

function providerName(provider: string) {
  const names: Record<string, string> = {
    qiniu: "七牛云",
    aliyun: "阿里云 OSS",
    tencent: "腾讯云 COS",
    rustfs: "RustFS",
    s3: "S3 兼容存储",
  };
  return names[provider] ?? provider;
}

function isS3CompatibleProvider(provider: string) {
  return provider === "rustfs" || provider === "s3";
}

function formatBytes(value: number) {
  if (!value) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const index = Math.floor(Math.log(value) / Math.log(1024));
  return `${(value / 1024 ** index).toFixed(2)}${units[index]}`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(
    date.getDate(),
  )}日 ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
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

function joinLocalPath(directory: string, fileName: string) {
  const separator = directory.includes("\\") ? "\\" : "/";
  return `${directory.replace(/[\\/]+$/, "")}${separator}${fileName}`;
}

function loadObjectLayout(): ObjectLayout {
  return window.localStorage.getItem(objectLayoutStorageKey) === "table"
    ? "table"
    : "grid";
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
    const rawSettings = window.localStorage.getItem(classicSettingsStorageKey);
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

function transferProgress(task: TransferTask) {
  if (task.status === "completed") return 100;
  if (task.total <= 0) return task.status === "running" ? 5 : 0;
  return Math.min(100, Math.max(0, (task.transferred / task.total) * 100));
}
