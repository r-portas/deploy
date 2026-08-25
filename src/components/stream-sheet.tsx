import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import type { StreamStatus } from "@/hooks/use-stream";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<StreamStatus, string> = {
  idle: "Idle",
  streaming: "Running",
  success: "Success",
  error: "Failed",
};

function StatusBadge({ status }: { status: StreamStatus }) {
  return (
    <Badge
      variant={status === "error" ? "destructive" : "outline"}
      className={cn(
        status === "success" &&
          "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
      )}
    >
      {status === "streaming" && <Spinner data-icon="inline-start" />}
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export interface StreamSheetProps<TItem> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** The object returned by `useStream` — only the read side is needed here. */
  stream: {
    items: TItem[];
    status: StreamStatus;
    error?: Error | undefined;
  };
}

/**
 * Sheet that shows a `useStream` run's status and log lines as they arrive.
 *
 * @remarks
 * Fully controlled: the caller owns `open`/`onOpenChange`, typically opening
 * the sheet at the same time it calls `stream.run(...)`.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = React.useState(false);
 * const restartApp = useServerFn(restartAppFn);
 * const restartStream = useStream(restartApp);
 *
 * <StreamSheet
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Restart nginx-static-web"
 *   stream={restartStream}
 * />
 *
 * <Button
 *   onClick={() => {
 *     setOpen(true);
 *     restartStream.run({ data: app.path });
 *   }}
 * >
 *   Restart
 * </Button>
 * ```
 */
export function StreamSheet<TItem>({
  open,
  onOpenChange,
  title,
  description,
  stream,
}: StreamSheetProps<TItem>) {
  const logRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (stream.items.length === 0) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [stream.items]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <SheetTitle>{title}</SheetTitle>
            <StatusBadge status={stream.status} />
          </div>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div ref={logRef} className="flex-1 overflow-y-auto px-4">
          <pre className="rounded-md bg-muted p-3 font-mono text-xs text-wrap text-muted-foreground">
            {stream.items.length > 0 ? stream.items.map(String).join("\n") : "Waiting for output…"}
          </pre>
        </div>
        {stream.error && (
          <p className="px-4 pb-4 text-xs text-destructive">{stream.error.message}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
