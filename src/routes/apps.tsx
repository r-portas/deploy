import { createFileRoute } from "@tanstack/react-router";

import { AppTable } from "@/components/apps/app-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listAppsFn } from "@/lib/apps.functions";

export const Route = createFileRoute("/apps")({
  component: RouteComponent,
  loader: async () => ({
    apps: await listAppsFn(),
  }),
});

function RouteComponent() {
  const { apps } = Route.useLoaderData();

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Apps</CardTitle>
        <CardDescription>Docker Compose apps found across cloned repos.</CardDescription>
      </CardHeader>
      <CardContent>
        <AppTable apps={apps} />
      </CardContent>
    </Card>
  );
}
