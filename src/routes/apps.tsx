import * as React from "react";

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Play, Square } from "lucide-react";

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
import { listAppsFn, startAppFn, stopAppFn } from "@/lib/apps.functions";

import type { ComposeApp } from "@/lib/apps.server";

export const Route = createFileRoute("/apps")({
  component: RouteComponent,
  loader: async () => ({
    apps: await listAppsFn(),
  }),
});

type AppAction = "start" | "stop";

function AppActions({ app }: { app: ComposeApp }) {
  const router = useRouter();
  const startApp = useServerFn(startAppFn);
  const stopApp = useServerFn(stopAppFn);

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

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== undefined}
          onClick={() => run("start", () => startApp({ data: app.path }))}
        >
          <Play />
          {pending === "start" ? "Starting..." : "Start"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== undefined}
          onClick={() => run("stop", () => stopApp({ data: app.path }))}
        >
          <Square />
          {pending === "stop" ? "Stopping..." : "Stop"}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function RouteComponent() {
  const { apps } = Route.useLoaderData();

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Apps</CardTitle>
        <CardDescription>Docker Compose apps found across cloned repos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Path</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No apps found. Clone a repo with a Docker Compose file to get started.
                </TableCell>
              </TableRow>
            ) : (
              apps.map((app) => (
                <TableRow key={app.path}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell className="text-muted-foreground">{app.path}</TableCell>
                  <TableCell className="text-right">
                    <AppActions app={app} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
