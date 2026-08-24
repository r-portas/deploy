import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Play, RotateCw, Square } from "lucide-react";
import * as React from "react";

import { StreamSheet } from "@/components/stream-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useStream from "@/hooks/use-stream";
import { restartAppFn, startAppFn, stopAppFn } from "@/lib/apps.functions";
import type { DockerContainer } from "@/lib/apps.schemas";
import type { App } from "@/lib/apps.types";
import { cn } from "@/lib/utils";

type AppAction = "start" | "stop" | "restart";

const ACTION_LABEL: Record<AppAction, string> = {
  start: "Start",
  stop: "Stop",
  restart: "Restart",
};

const ACTION_PENDING_LABEL: Record<AppAction, string> = {
  start: "Starting...",
  stop: "Stopping...",
  restart: "Restarting...",
};

const ACTION_ICON: Record<AppAction, React.ReactNode> = {
  start: <Play />,
  stop: <Square />,
  restart: <RotateCw />,
};

function AppActions({ app }: { app: App }) {
  const router = useRouter();
  const startApp = useServerFn(startAppFn);
  const stopApp = useServerFn(stopAppFn);
  const restartApp = useServerFn(restartAppFn);
  const streams = {
    start: useStream(startApp),
    stop: useStream(stopApp),
    restart: useStream(restartApp),
  };

  const [pending, setPending] = React.useState<AppAction | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [sheetAction, setSheetAction] = React.useState<AppAction | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const run = async (action: AppAction) => {
    setError(undefined);
    setPending(action);
    setSheetAction(action);
    setSheetOpen(true);
    try {
      await streams[action].run({ data: app.path });
      // Re-run the loader so the change is reflected without a full reload.
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} app`);
    } finally {
      setPending(undefined);
    }
  };

  const actionButton = (action: AppAction) => (
    <Tooltip key={action}>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={ACTION_LABEL[action]}
            disabled={pending !== undefined}
            onClick={() => run(action)}
          >
            {ACTION_ICON[action]}
          </Button>
        }
      />
      <TooltipContent>
        {pending === action ? ACTION_PENDING_LABEL[action] : ACTION_LABEL[action]}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {app.running ? [actionButton("restart"), actionButton("stop")] : actionButton("start")}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {sheetAction && (
        <StreamSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={`${ACTION_LABEL[sheetAction]} ${app.name}`}
          stream={streams[sheetAction]}
        />
      )}
    </div>
  );
}

function AppStatus({ running }: { running: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5",
        running
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : "text-muted-foreground",
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", running ? "bg-green-500" : "bg-muted-foreground")}
      />
      {running ? "Running" : "Stopped"}
    </Badge>
  );
}

function AppContainers({ containers }: { containers: DockerContainer[] }) {
  if (containers.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex gap-1">
      {containers.map((container) => (
        <Tooltip key={container.id}>
          <TooltipTrigger
            aria-label={container.names}
            className="size-3.5 shrink-0 rounded-xs bg-green-500 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <TooltipContent>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">{container.names}</span>
              <span>{container.image}</span>
              <span>{container.status}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

/**
 * Builds the URL for a port exposed on the host this app is served from.
 *
 * @remarks
 * Uses the browser's own protocol/hostname rather than hardcoding
 * `localhost`, since the deployed app is served from the same host that
 * runs the Docker containers, but users may reach it via a LAN IP or
 * domain instead of `localhost`. Falls back to `localhost` during SSR,
 * where `window` isn't available.
 */
function portUrl(port: string): string {
  if (typeof window === "undefined") return `http://localhost:${port}`;
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
}

function AppPorts({ ports }: { ports: string[] }) {
  if (ports.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {ports.map((port) => {
        const url = portUrl(port);

        return (
          <Tooltip key={port}>
            <TooltipTrigger
              render={
                <Badge
                  variant="outline"
                  render={<a href={url} target="_blank" rel="noopener noreferrer" />}
                >
                  {port}
                  <ExternalLink data-icon="inline-end" />
                </Badge>
              }
            />
            <TooltipContent>Open {url}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

export function AppTableRow({ app }: { app: App }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{app.name}</TableCell>
      <TableCell className="text-muted-foreground">{app.path}</TableCell>
      <TableCell>
        <AppStatus running={app.running} />
      </TableCell>
      <TableCell>
        <AppContainers containers={app.containers} />
      </TableCell>
      <TableCell>
        <AppPorts ports={app.ports} />
      </TableCell>
      <TableCell className="text-right">
        <AppActions app={app} />
      </TableCell>
    </TableRow>
  );
}
