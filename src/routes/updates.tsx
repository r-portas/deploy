import { createFileRoute, useRouter } from "@tanstack/react-router";
import { PackageCheck, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useRunUpdate } from "@/hooks/use-run-update";
import { listUpdatesFn } from "@/lib/updates.functions";

export const Route = createFileRoute("/updates")({
  loader: () => listUpdatesFn(),
  component: RouteComponent,
});

function RouteComponent() {
  const updates = Route.useLoaderData();
  const router = useRouter();
  const { log, running, run } = useRunUpdate();
  const [confirming, setConfirming] = useState(false);

  async function handleUpdateAll() {
    setConfirming(false);
    await run();
    await router.invalidate();
  }

  if (updates.length === 0 && log.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageCheck />
          </EmptyMedia>
          <EmptyTitle>Everything is up to date</EmptyTitle>
          <EmptyDescription>No package updates are available.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {updates.length} update{updates.length === 1 ? "" : "s"} available
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={running}
              onClick={() => router.invalidate()}
            >
              <RefreshCw /> Refresh
            </Button>
            {confirming ? (
              <>
                <Button size="sm" onClick={handleUpdateAll} disabled={running}>
                  Confirm update
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={() => setConfirming(true)}
                disabled={running || updates.length === 0}
              >
                Update all
              </Button>
            )}
          </div>
        </CardHeader>
        {updates.length > 0 && (
          <CardContent>
            <ul className="grid gap-1">
              {updates.map((update) => (
                <li
                  key={update.name}
                  className="flex items-baseline justify-between gap-4 px-2 py-1.5 text-sm"
                >
                  <span className="font-medium">{update.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {update.currentVersion} → {update.newVersion}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {log.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Update log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
              {log.join("\n")}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
