import type { CSSProperties, ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function SidebarProvider({
  className,
  style,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-wrapper"
      style={
        {
          "--sidebar-width": "16rem",
          ...style,
        } as CSSProperties
      }
      className={cn("flex min-h-svh w-full", className)}
      {...props}
    />
  );
}

function Sidebar({ className, ...props }: ComponentProps<"aside">) {
  return (
    <aside
      data-slot="sidebar"
      className={cn(
        "flex h-full w-(--sidebar-width) shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="sidebar-group"
      className={cn("flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuButton({
  className,
  isActive = false,
  tooltip,
  ...props
}: ComponentProps<typeof Button> & {
  isActive?: boolean;
  tooltip?: string;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      data-slot="sidebar-menu-button"
      data-active={isActive}
      className={cn(
        "h-7 w-full justify-start overflow-hidden px-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground [&>span:last-child]:truncate",
        className,
      )}
      {...props}
    />
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
};
