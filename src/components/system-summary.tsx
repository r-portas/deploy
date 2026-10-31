import { barX, colorLegend, defineChart, stack } from "@tanstack/charts";
import { colorLegendItems } from "@tanstack/charts/legend";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DockerInfo } from "@/lib/docker.schemas";

/**
 * A full width card summarising the Docker host: a stacked bar of container states above key host details.
 */
export function SystemSummary({ info }: { info: DockerInfo }) {
  const states: [string, number][] = [
    ["running", info.ContainersRunning],
    ["paused", info.ContainersPaused],
    ["stopped", info.ContainersStopped],
  ];
  const rows = states.map(([state, count]) => ({
    group: "Containers",
    state,
    count,
    // The legend shows the color value, so bake the count into it
    label: `${state} ${count}`,
  }));
  const labels = rows.map((row) => row.label);

  // Rebuilt per render as it captures the Docker info; cheap for three rows
  const definition = defineChart({
    marks: [
      barX(rows, {
        x: "count",
        y: "group",
        color: "label",
        key: "label",
        radius: 4,
        layout: stack({ order: labels }),
      }),
    ],
    // Axes are hidden as the legend and card header already carry the numbers
    scales: {
      x: { scale: scaleLinear, axis: false },
      y: { scale: () => scaleBand<string>().padding(0), axis: false },
    },
    color: {
      domain: labels,
      range: ["var(--primary)", "var(--muted-foreground)", "var(--destructive)"],
      legend: colorLegend({
        placement: "bottom",
        items: colorLegendItems({ justify: "center", gap: 20 }),
      }),
    },
    // The focus ring would mark the bar's end point, which means nothing on a stacked bar
    focusRing: false,
    tooltip: {
      use: tooltip,
      anchor: "pointer",
      format: (point) => `${point.datum.state}: ${point.datum.count}`,
    },
  });

  const details = [
    ["Docker", info.ServerVersion],
    ["Operating system", info.OperatingSystem],
    ["Architecture", `${info.OSType}/${info.Architecture}`],
    ["Kernel", info.KernelVersion],
    ["CPUs", info.NCPU],
    ["Memory", `${(info.MemTotal / 1024 ** 3).toFixed(1)} GiB`],
    ["Images", info.Images],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{info.Name}</CardTitle>
        <CardDescription>
          {info.ContainersRunning} of {info.Containers} containers running
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <Chart
          definition={definition}
          height={88}
          initialWidth={640}
          ariaLabel={`Containers by state: ${rows.map((row) => `${row.count} ${row.state}`).join(", ")}`}
        />
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr_auto_1fr]">
          {details.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
