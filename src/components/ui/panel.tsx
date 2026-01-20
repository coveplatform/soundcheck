import * as React from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PanelProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function Panel({ title, action, children, className, contentClassName }: PanelProps) {
  return (
    <Card variant="soft" elevated className={className}>
      {title ? (
        <CardHeader className="border-b border-black/10">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-black tracking-tight">{title}</CardTitle>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cn(title ? "pt-6" : "pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
