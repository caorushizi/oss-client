import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";
import circleBackground from "../../assets/images/circle-bg.png";
import ovalBackground from "../../assets/images/oval-bg.png";
import { apiRequest } from "../../lib/backend/client";
import { cn } from "../../lib/utils";

type FloatWindowStyle = "circle" | "oval";
type FloatStatus = "idle" | "dragging" | "uploading" | "success" | "error";

interface FloatWindowConfig {
  visible: boolean;
  style: FloatWindowStyle;
}

interface FloatUploadContext {
  profileId: string;
  bucket: string;
  region?: string;
  prefix: string;
  rename: boolean;
  overwrite: boolean;
  useHttps: boolean;
}

export function FloatWindow() {
  const floatWindow = getCurrentWindow();
  const [style, setStyle] = useState<FloatWindowStyle>("circle");
  const [status, setStatus] = useState<FloatStatus>("idle");
  const [error, setError] = useState<string>();

  const uploadPaths = useCallback(async (paths: string[]) => {
    if (!paths.length) return;
    setStatus("uploading");
    setError(undefined);

    try {
      const context = await invoke<FloatUploadContext | null>(
        "float_upload_context",
      );
      if (!context) {
        throw new Error("请先在主窗口选择储存桶");
      }

      const results = await Promise.allSettled(
        paths.map((localPath) => {
          const fileName = fileNameFromPath(localPath);
          if (!fileName) {
            return Promise.reject(new Error("无法识别文件名"));
          }
          const objectName = context.rename
            ? renamedFileName(fileName)
            : fileName;
          return apiRequest("/api/v1/transfers", {
            method: "POST",
            body: JSON.stringify({
              direction: "upload",
              profileId: context.profileId,
              bucket: context.bucket,
              region: context.region,
              objectKey: `${context.prefix}${objectName}`,
              localPath,
              overwrite: context.overwrite,
              useHttps: context.useHttps,
            }),
          });
        }),
      );
      const failed = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (failed) {
        throw failed.reason;
      }

      setStatus("success");
      window.setTimeout(() => setStatus("idle"), 1200);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "上传任务启动失败",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const cleanups: UnlistenFn[] = [];

    async function initialize() {
      const unlistenState = await listen<FloatWindowConfig>(
        "float-window-state",
        ({ payload }) => setStyle(payload.style),
      );
      if (disposed) {
        unlistenState();
        return;
      }
      cleanups.push(unlistenState);

      const config = await invoke<FloatWindowConfig>("float_window_state");
      if (!disposed) setStyle(config.style);

      const unlistenDrop = await floatWindow.onDragDropEvent(({ payload }) => {
        if (payload.type === "enter" || payload.type === "over") {
          setStatus("dragging");
          setError(undefined);
          return;
        }
        if (payload.type === "drop") {
          void uploadPaths(payload.paths);
          return;
        }
        setStatus("idle");
      });
      if (disposed) {
        unlistenDrop();
        return;
      }
      cleanups.push(unlistenDrop);
    }

    void initialize().catch((initializationError) => {
      if (disposed) return;
      setError(
        initializationError instanceof Error
          ? initializationError.message
          : "悬浮窗初始化失败",
      );
      setStatus("error");
    });

    return () => {
      disposed = true;
      for (const cleanup of cleanups) cleanup();
    };
  }, [uploadPaths]);

  const label = statusLabel(status);
  const background = style === "circle" ? circleBackground : ovalBackground;

  return (
    <div
      className={cn(
        "legacy-float-shell",
        `is-${style}`,
        status === "dragging" && "is-dragging",
        status === "error" && "is-error",
      )}
      title={error || "将文件拖入此处上传"}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        void floatWindow.startDragging().catch((dragError) => {
          setError(
            dragError instanceof Error ? dragError.message : "无法移动悬浮窗",
          );
          setStatus("error");
        });
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="legacy-float-base" />
      <img className="legacy-float-background" src={background} alt="" />
      <span className="legacy-float-label" aria-live="polite">
        {label}
      </span>
    </div>
  );
}

function statusLabel(status: FloatStatus) {
  const labels: Record<FloatStatus, string> = {
    idle: "拖拽上传",
    dragging: "松开上传",
    uploading: "上传中…",
    success: "已添加",
    error: "上传失败",
  };
  return labels[status];
}

function fileNameFromPath(path: string) {
  return path.split(/[\\/]/).filter(Boolean).at(-1) ?? "";
}

function renamedFileName(fileName: string) {
  const extensionIndex = fileName.lastIndexOf(".");
  const extension = extensionIndex > 0 ? fileName.slice(extensionIndex) : "";
  return `${crypto.randomUUID()}${extension}`;
}
