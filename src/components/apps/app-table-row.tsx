import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Play, RotateCw, ScrollText, Square } from "lucide-react";
import * as React from "react";

import ActionButton from "@/components/action-button";
import { StreamSheet } from "@/components/stream-sheet";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import useStream from "@/hooks/use-stream";
import { logsAppFn, restartAppFn, startAppFn, stopAppFn } from "@/lib/apps.functions";
import type { DockerContainer } from "@/lib/apps.schemas";
import type { App } from "@/lib/apps.types";
import { cn } from "@/lib/utils";

// #region AppLogsAction
interface AppLogsActionProps {
  /** The app whose compose logs to follow. */
  app: App;
  /** Surfaces a follow-stream failure next to the action buttons. */
  onError: (message: string | undefined) => void;
}

/**
 * Follows an app's compose logs in a sheet, aborting the tail when closed.
 */
function AppLogsAction({ app, onError }: AppLogsActionProps) {
  const logsApp = useServerFn(logsAppFn);
  const stream = useStream(logsApp);
  const [pending, setPending] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    stream.run({ data: app.path });
    onError(undefined);
    setPending(true);
    setOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setPending(false);
    }
  };

  return (
    <>
      <ActionButton
        label="View Logs"
        pendingLabel="Loading logs..."
        icon={<ScrollText />}
        pending={pending}
        onClick={handleOpen}
      />
      <StreamSheet
        open={open}
        onOpenChange={handleOpenChange}
        title={`${app.name} logs`}
        stream={stream}
      />
    </>
  );
}
// #endregion

// #region AppActions
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

const ACTION_SHEET_TITLE: Record<AppAction, (appName: string) => string> = {
  start: (appName) => `Start ${appName}`,
  stop: (appName) => `Stop ${appName}`,
  restart: (appName) => `Restart ${appName}`,
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

  const [busy, setBusy] = React.useState(false);
  const [pending, setPending] = React.useState<AppAction | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [sheetAction, setSheetAction] = React.useState<AppAction | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const run = async (action: AppAction) => {
    setError(undefined);
    setPending(action);
    setBusy(true);
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
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {app.running ? (
          <>
            <ActionButton
              label={ACTION_LABEL.restart}
              pendingLabel={ACTION_PENDING_LABEL.restart}
              icon={ACTION_ICON.restart}
              pending={pending === "restart"}
              disabled={busy}
              onClick={() => run("restart")}
            />
            <ActionButton
              label={ACTION_LABEL.stop}
              pendingLabel={ACTION_PENDING_LABEL.stop}
              icon={ACTION_ICON.stop}
              pending={pending === "stop"}
              disabled={busy}
              onClick={() => run("stop")}
            />
          </>
        ) : (
          <ActionButton
            label={ACTION_LABEL.start}
            pendingLabel={ACTION_PENDING_LABEL.start}
            icon={ACTION_ICON.start}
            pending={pending === "start"}
            disabled={busy}
            onClick={() => run("start")}
          />
        )}
        <AppLogsAction app={app} onError={setError} />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {sheetAction && (
        <StreamSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={ACTION_SHEET_TITLE[sheetAction](app.name)}
          stream={streams[sheetAction]}
        />
      )}
    </div>
  );
}
// #endregion

// #region AppStatus
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
// #endregion

// #region AppContainers
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
// #endregion

// #region AppPorts
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
// #endregion

/**
 * A single app row: name, path, status, containers, ports, and actions.
 */
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
