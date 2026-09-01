import type { ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type AppEmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AppEmptyState({
  title,
  description,
  children,
}: AppEmptyStateProps) {
  return (
    <Empty className="legacy-empty border-0">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {children ? <EmptyContent>{children}</EmptyContent> : null}
    </Empty>
  );
}
