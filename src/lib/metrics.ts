import type { DockerStats } from "./metrics.schemas";
import type { ContainerSeries, MetricEvent } from "./metrics.types";

/** Number of samples kept per container, about two minutes at Docker's 1 sample/s. */
export const MAX_SAMPLES = 120;

/**
 * CPU use as a percentage of one core, from the delta between this sample and the one before it.
 *
 * @remarks
 * Returns 0 when Docker gives no usable delta, e.g. on the first sample.
 */
export function computeCpuPercent(stats: DockerStats): number {
  const { cpu_stats: cpu, precpu_stats: pre } = stats;
  const usage = cpu.cpu_usage?.total_usage;
  const preUsage = pre.cpu_usage?.total_usage;
  const system = cpu.system_cpu_usage;
  const preSystem = pre.system_cpu_usage;
  if (usage === undefined || preUsage === undefined) return 0;
  if (system === undefined || preSystem === undefined) return 0;

  const cpuDelta = usage - preUsage;
  const systemDelta = system - preSystem;
  if (cpuDelta <= 0 || systemDelta <= 0) return 0;
  return (cpuDelta / systemDelta) * (cpu.online_cpus ?? 1) * 100;
}

/**
 * Memory in use in bytes, excluding reclaimable page cache like `docker stats` does.
 */
export function computeMemoryBytes(stats: DockerStats): number {
  const { usage = 0, stats: detail } = stats.memory_stats;
  // cgroup v2 reports `inactive_file`, v1 reports `cache`
  const cache = detail?.inactive_file ?? detail?.cache ?? 0;
  return Math.max(0, usage - cache);
}

/**
 * Cumulative bytes received and sent, summed across all of the container's networks.
 */
export function sumNetwork(stats: DockerStats): { rx: number; tx: number } {
  let rx = 0;
  let tx = 0;
  for (const network of Object.values(stats.networks ?? {})) {
    rx += network.rx_bytes;
    tx += network.tx_bytes;
  }
  return { rx, tx };
}

/**
 * Explains why Docker reports no per-container network stats for a network mode, or `undefined`
 * if it does.
 *
 * @remarks
 * `host` uses the host's interfaces, `none` has none, and `container:<id>` shares another
 * container's namespace. In all three the `networks` stats are absent, so rates would read as 0.
 */
export function networkUnavailableReason(networkMode: string): string | undefined {
  if (networkMode === "host") return "host networking";
  if (networkMode === "none") return "no network";
  if (networkMode.startsWith("container:")) return "shared network";
  return undefined;
}

/**
 * Turns a cumulative counter into a per-second rate.
 *
 * @remarks
 * Returns 0 for a non-positive interval or a counter that went backwards (e.g. the container restarted).
 */
export function toRate(current: number, previous: number, seconds: number): number {
  if (seconds <= 0 || current < previous) return 0;
  return (current - previous) / seconds;
}

/**
 * Applies a stream event to the per-container series, returning a new map.
 *
 * @remarks
 * Each series is trimmed to the latest {@link MAX_SAMPLES} samples.
 */
export function applyMetricEvent(
  state: Record<string, ContainerSeries>,
  event: MetricEvent,
): Record<string, ContainerSeries> {
  if (event.type === "idle") return state;

  if (event.type === "stopped") {
    const { [event.id]: _removed, ...rest } = state;
    return rest;
  }

  const existing = state[event.id];
  const samples = [...(existing?.samples ?? []), event].slice(-MAX_SAMPLES);
  return {
    ...state,
    [event.id]: { id: event.id, name: event.name, networkMode: event.networkMode, samples },
  };
}

/**
 * Formats a byte count with a binary unit, e.g. `1536` becomes `"1.5 KiB"`.
 */
export function formatBytes(bytes: number): string {
  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}
