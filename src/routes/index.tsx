import { createFileRoute } from "@tanstack/react-router";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>
          Track progress and recent activity for your TanStack Start app.
        </CardDescription>
      </CardHeader>
      <CardContent>Your design system is ready. Start building your next component.</CardContent>
    </Card>
  );
}
