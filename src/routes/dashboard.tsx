import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getDashboardFn } from "@/lib/dashboard.functions";

export const Route = createFileRoute("/dashboard")({
  loader: () => getDashboardFn(),
  component: RouteComponent,
});

function RouteComponent() {
  const groups = Route.useLoaderData();

  if (groups.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutDashboard />
          </EmptyMedia>
          <EmptyTitle>No services yet</EmptyTitle>
          <EmptyDescription>
            Add the <code>homepage.name</code> and <code>homepage.href</code> labels (optionally{" "}
            <code>homepage.group</code> and <code>homepage.description</code>) to a container.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.name}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1">
              {group.services.map((service) => (
                <li key={service.href + service.name}>
                  <a
                    href={service.href}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md px-2 py-1.5 hover:bg-muted"
                  >
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="text-sm font-medium">{service.name}</span>
                      <Badge variant={service.state === "running" ? "secondary" : "destructive"}>
                        {service.state}
                      </Badge>
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {service.description ? `${service.description} · ` : ""}
                      {service.status}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
