import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Play, RotateCw, Square } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { listAppsFn, restartAppFn, startAppFn, stopAppFn } from "@/lib/apps.functions";
import type { DockerContainer } from "@/lib/apps.schemas";
import type { App } from "@/lib/apps.types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/apps")({
  component: RouteComponent,
  loader: async () => ({
    apps: await listAppsFn(),
  }),
});

type AppAction = "start" | "stop" | "restart";

function AppActions({ app }: { app: App }) {
  const router = useRouter();
  const startApp = useServerFn(startAppFn);
  const stopApp = useServerFn(stopAppFn);
  const restartApp = useServerFn(restartAppFn);

  const [pending, setPending] = React.useState<AppAction | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const run = async (action: AppAction, task: () => Promise<string>) => {
    setError(undefined);
    setPending(action);
    try {
      await task();
      // Re-run the loader so the change is reflected without a full reload.
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} app`);
    } finally {
      setPending(undefined);
    }
  };

  const actionButton = (
    action: AppAction,
    label: string,
    icon: React.ReactNode,
    task: () => Promise<string>,
  ) => (
    <Tooltip key={action}>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={label}
            disabled={pending !== undefined}
            onClick={() => run(action, task)}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        {app.running
          ? [
              actionButton(
                "restart",
                pending === "restart" ? "Restarting..." : "Restart",
                <RotateCw />,
                () => restartApp({ data: app.path }),
              ),
              actionButton("stop", pending === "stop" ? "Stopping..." : "Stop", <Square />, () =>
                stopApp({ data: app.path }),
              ),
            ]
          : actionButton("start", pending === "start" ? "Starting..." : "Start", <Play />, () =>
              startApp({ data: app.path }),
            )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
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

function RouteComponent() {
  const { apps } = Route.useLoaderData();

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Apps</CardTitle>
        <CardDescription>Docker Compose apps found across cloned repos.</CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Containers</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No apps found. Clone a repo with a Docker Compose file to get started.
                  </TableCell>
                </TableRow>
              ) : (
                apps.map((app) => (
                  <TableRow key={app.path}>
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
                ))
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
