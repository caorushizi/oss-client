import { Download, Upload, X } from "lucide-react";

import { AppEmptyState } from "@/components/app/empty-state";
import { FileTypeIcon, fileIconName } from "@/components/app/file-type-icon";
import { IconButton } from "@/components/app/icon-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TransferTask } from "@/features/transfers/use-transfers";
import { formatBytes, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type TransferPageProps = {
  completed: boolean;
  tasks: TransferTask[];
  error?: string;
  onCancel: (id: string) => Promise<void>;
  onClearCompleted: () => Promise<void>;
};

export function TransferPage({
  completed,
  tasks,
  error,
  onCancel,
  onClearCompleted,
}: TransferPageProps) {
  return (
    <section className="legacy-page legacy-transfer-page">
      {error ? (
        <Alert variant="destructive" className="mx-3 mt-2 w-auto py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {tasks.length ? (
        <>
          <div className="legacy-transfer-toolbar">
            <span>总共 {tasks.length} 项</span>
            {completed ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void onClearCompleted()}
              >
                清空记录
              </Button>
            ) : null}
          </div>
          <div className="legacy-transfer-table">
            {tasks.map((task) => {
              const progress = transferProgress(task);
              return (
                <div
                  className={cn(
                    "legacy-transfer-row",
                    completed && "is-completed",
                  )}
                  key={task.id}
                >
                  <div className="legacy-transfer-meta">
                    <FileTypeIcon
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
                        <Progress value={progress} />
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <span className="legacy-transfer-direction">
                        {task.direction === "upload" ? (
                          <Upload className="size-4" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </span>
                      <span className="legacy-transfer-action">
                        {task.status === "queued" ||
                        task.status === "running" ? (
                          <IconButton
                            label={`取消 ${task.fileName}`}
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            tooltipSide="left"
                            onClick={() => void onCancel(task.id)}
                          >
                            <X className="size-4" />
                          </IconButton>
                        ) : null}
                      </span>
                    </>
                  )}
                  {task.error ? (
                    <Alert
                      variant="destructive"
                      className="legacy-task-error py-1"
                    >
                      <AlertDescription>{task.error}</AlertDescription>
                    </Alert>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <AppEmptyState title="没有文件" description="没有找到传输列表" />
      )}
    </section>
  );
}

function transferProgress(task: TransferTask) {
  if (task.status === "completed") return 100;
  if (task.total <= 0) return task.status === "running" ? 5 : 0;
  return Math.min(100, Math.max(0, (task.transferred / task.total) * 100));
}
