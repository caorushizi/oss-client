import {
  ArrowDownToLine,
  Boxes,
  CheckCircle2,
  Folder,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import type { Bucket } from "@/features/buckets/use-buckets";

export type AppView =
  | "browser"
  | "transfers"
  | "completed"
  | "profiles"
  | "settings";

type AppSidebarProps = {
  activeView: AppView;
  activeBucket?: Bucket;
  buckets?: Bucket[];
  bucketsLoading: boolean;
  runningTransfers: number;
  onOpenBucket: (bucket: Bucket) => void;
  onNavigate: (view: AppView) => void;
};

export function AppSidebar({
  activeView,
  activeBucket,
  buckets,
  bucketsLoading,
  runningTransfers,
  onOpenBucket,
  onNavigate,
}: AppSidebarProps) {
  return (
    <Sidebar className="legacy-sidebar">
      <SidebarHeader className="legacy-title-bar p-0" data-tauri-drag-region>
        <span data-tauri-drag-region>OSS Client</span>
      </SidebarHeader>
      <SidebarContent className="gap-5 px-1 py-3">
        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="h-7 justify-between px-2 text-sm font-normal text-sidebar-foreground/55">
            <span>储存空间</span>
            {bucketsLoading ? <Spinner className="size-3" /> : null}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {buckets?.length ? (
                buckets.map((bucket) => (
                  <SidebarMenuItem
                    key={`${bucket.name}:${bucket.region ?? ""}`}
                  >
                    <SidebarMenuButton
                      isActive={
                        activeView === "browser" &&
                        activeBucket?.name === bucket.name
                      }
                      tooltip={bucket.name}
                      onClick={() => onOpenBucket(bucket)}
                    >
                      <Folder />
                      <span>{bucket.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Folder />
                    <span>暂无储存桶</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="h-7 justify-between px-2 text-sm font-normal text-sidebar-foreground/55">
            <span>传输列表</span>
            {runningTransfers > 0 ? (
              <span className="text-xs tabular-nums">{runningTransfers}</span>
            ) : null}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "transfers"}
                  onClick={() => onNavigate("transfers")}
                >
                  <ArrowDownToLine />
                  <span>传输列表</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "completed"}
                  onClick={() => onNavigate("completed")}
                >
                  <CheckCircle2 />
                  <span>传输完成</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="p-1">
          <SidebarGroupLabel className="h-7 px-2 text-sm font-normal text-sidebar-foreground/55">
            设置
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "settings"}
                  onClick={() => onNavigate("settings")}
                >
                  <Settings />
                  <span>设置</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeView === "profiles"}
                  onClick={() => onNavigate("profiles")}
                >
                  <Boxes />
                  <span>apps</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
