import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { ContainerMetricsCard } from "@/components/container-metrics-card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useContainerMetrics } from "@/hooks/use-container-metrics";

export const Route = createFileRoute("/metrics")({
  component: RouteComponent,
});

function RouteComponent() {
  const { series, loaded } = useContainerMetrics();

  if (series.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Activity />
          </EmptyMedia>
          <EmptyTitle>{loaded ? "No running containers" : "Connecting…"}</EmptyTitle>
          <EmptyDescription>
            {loaded
              ? "Live CPU, memory and network charts appear here for each running container."
              : "Waiting for the metrics stream."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4">
      {series.map((s) => (
        <ContainerMetricsCard key={s.id} series={s} />
      ))}
    </div>
  );
}
