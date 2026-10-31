import { areaY, defineChart, lineY, ruleY } from "@tanstack/charts";
import { decorative } from "@tanstack/charts/mark/decorative";
import { Chart } from "@tanstack/charts/react";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { ClientOnly } from "@tanstack/react-router";
import { useMemo } from "react";
import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, MAX_SAMPLES } from "@/lib/metrics";
import type { ContainerSeries } from "@/lib/metrics.types";

const CHART_HEIGHT = 96;
// Fixed so a young series fills in from the right instead of stretching across the width
const WINDOW_SECONDS = MAX_SAMPLES;

type Point = { id: string; seconds: number; metric: string; value: number };

type MetricLine = {
  name: string;
  color: string;
  value: (sample: ContainerSeries["samples"][number]) => number;
};

// Module-level so each array keeps a stable identity and can safely be a useMemo dependency
const CPU_LINES: MetricLine[] = [{ name: "CPU", color: "var(--chart-1)", value: (s) => s.cpu }];
const MEMORY_LINES: MetricLine[] = [
  { name: "Memory", color: "var(--chart-1)", value: (s) => s.memory / 1024 ** 2 },
];
const NETWORK_LINES: MetricLine[] = [
  { name: "RX", color: "var(--success)", value: (s) => s.rx / 1024 },
  // Negative so TX plots below the zero line, mirroring RX above it
  { name: "TX", color: "var(--warning)", value: (s) => -s.tx / 1024 },
];

/**
 * Builds a line chart definition. X is seconds before the latest sample, so the window scrolls left over a fixed span.
 */
function createDefinition(points: Point[], metrics: string[], colors: string[], label: string) {
  return defineChart({
    marks: [
      // Decorative so the line keeps sole ownership of focus and tooltips
      decorative(
        // Explicit 0 baseline (not stacked) so RX and TX fill toward zero from either side
        areaY(points, {
          id: "area",
          x: "seconds",
          y1: 0,
          y2: "value",
          z: "metric",
          color: "metric",
          key: "id",
          fillOpacity: 0.2,
        }),
      ),
      decorative(ruleY([0], { id: "zero" })),
      lineY(points, {
        id: "line",
        x: "seconds",
        y: "value",
        z: "metric",
        color: "metric",
        key: "id",
      }),
    ],
    scales: {
      x: {
        scale: scaleLinear().domain([-WINDOW_SECONDS, 0]),
        axis: {
          ticks: {
            values: [-WINDOW_SECONDS, -WINDOW_SECONDS / 2, 0],
            format: (seconds) => (seconds === 0 ? "now" : `${seconds}s`),
          },
        },
      },
      y: {
        // Factory (not an instance) so the domain is inferred; the area baseline keeps 0 in view
        scale: scaleLinear,
        nice: true,
        axis: {
          label,
          // Absolute so TX, plotted below zero, still reads as a positive rate
          ticks: { count: 3, format: (value) => String(Math.abs(Number(value))) },
        },
      },
    },
    color: { domain: metrics, range: colors },
    focusRing: false,
  });
}

function MetricChart({
  name,
  samples,
  label,
  lines,
  summary,
}: {
  name: string;
  samples: ContainerSeries["samples"];
  label: string;
  lines: MetricLine[];
  summary: ReactNode;
}) {
  const definition = useMemo(() => {
    const latest = samples.at(-1)?.time ?? 0;
    const points = samples.flatMap((sample) =>
      lines.map((line) => ({
        id: `${line.name}-${sample.time}`,
        seconds: (sample.time - latest) / 1000,
        metric: line.name,
        value: line.value(sample),
      })),
    );
    return createDefinition(
      points,
      lines.map((line) => line.name),
      lines.map((line) => line.color),
      label,
    );
  }, [samples, label, lines]);

  return (
    <figure className="grid gap-1">
      <figcaption className="flex items-baseline justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{summary}</span>
      </figcaption>
      {/* Client only so the chart measures its real width on first paint */}
      <ClientOnly fallback={<div style={{ height: CHART_HEIGHT }} />}>
        <Chart
          definition={definition}
          height={CHART_HEIGHT}
          ariaLabel={`${name} ${label} over the last two minutes`}
        />
      </ClientOnly>
    </figure>
  );
}

/**
 * A card with CPU, memory and network line charts for one container.
 */
export function ContainerMetricsCard({ series }: { series: ContainerSeries }) {
  const latest = series.samples.at(-1);
  if (!latest) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{series.name}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <MetricChart
          name={series.name}
          samples={series.samples}
          label="CPU (%)"
          lines={CPU_LINES}
          summary={`${latest.cpu.toFixed(1)}%`}
        />
        <MetricChart
          name={series.name}
          samples={series.samples}
          label="Memory (MiB)"
          lines={MEMORY_LINES}
          summary={
            latest.memoryLimit
              ? `${formatBytes(latest.memory)} of ${formatBytes(latest.memoryLimit)}`
              : formatBytes(latest.memory)
          }
        />
        <MetricChart
          name={series.name}
          samples={series.samples}
          label="Network (KiB/s)"
          lines={NETWORK_LINES}
          summary={
            // The colored labels double as the legend for the two lines
            <>
              <span style={{ color: "var(--success)" }}>↓ RX</span> {formatBytes(latest.rx)}/s{" "}
              <span style={{ color: "var(--warning)" }}>↑ TX</span> {formatBytes(latest.tx)}/s
            </>
          }
        />
      </CardContent>
    </Card>
  );
}
