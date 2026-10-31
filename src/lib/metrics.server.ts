import type { DockerContainer } from "./docker.schemas";
import { listContainers, streamDockerJson } from "./docker.server";
import { computeCpuPercent, computeMemoryBytes, sumNetwork, toRate } from "./metrics";
import { dockerStatsSchema } from "./metrics.schemas";
import type { MetricEvent, MetricSample } from "./metrics.types";

/** How often to check for containers that started or stopped. */
const RECONCILE_MS = 10_000;

function containerName(container: DockerContainer) {
  return container.Names[0]?.replace(/^\//, "") ?? container.Id;
}

/**
 * Streams normalised samples for one container until the signal aborts or the container stops.
 *
 * @remarks
 * The first Docker sample is skipped: it has no previous reading, so rates can't be computed from it.
 *
 * @yields A sample for each Docker stats reading after the first.
 */
async function* streamContainerMetrics(
  container: DockerContainer,
  signal: AbortSignal,
): AsyncGenerator<MetricSample> {
  const name = containerName(container);
  let previous: { time: number; rx: number; tx: number } | undefined;

  for await (const stats of streamDockerJson(
    `/containers/${container.Id}/stats?stream=true`,
    dockerStatsSchema,
    signal,
  )) {
    const time = Date.parse(stats.read);
    const { rx, tx } = sumNetwork(stats);
    const last = previous;
    previous = { time, rx, tx };
    if (!last) continue;

    const seconds = (time - last.time) / 1000;
    yield {
      type: "sample",
      id: container.Id,
      name,
      networkMode: container.HostConfig.NetworkMode,
      time,
      cpu: computeCpuPercent(stats),
      memory: computeMemoryBytes(stats),
      memoryLimit: stats.memory_stats.limit ?? 0,
      rx: toRate(rx, last.rx, seconds),
      tx: toRate(tx, last.tx, seconds),
    };
  }
}

/**
 * Streams samples for every running container, merged into one stream.
 *
 * @remarks
 * Containers are re-listed periodically so ones started or stopped later are picked up or dropped.
 * Aborting `signal` (e.g. the client disconnecting) or cancelling the stream closes all upstream
 * Docker connections. The signal is needed because a stream idling with no containers can't otherwise
 * be closed.
 *
 * @param signal - Ends the stream when aborted.
 *
 * @returns Samples, a `stopped` event when a container's stats stream ends, and an `idle` event if
 * nothing is running at the start.
 */
export function streamMetrics(signal: AbortSignal): ReadableStream<MetricEvent> {
  const active = new Map<string, AbortController>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const shutdown = () => {
    closed = true;
    clearInterval(timer);
    for (const controller of active.values()) controller.abort();
  };

  return new ReadableStream<MetricEvent>({
    async start(stream) {
      // Aborted pumps still emit `stopped` while shutting down, and enqueue throws once closed
      const push = (event: MetricEvent) => {
        if (!closed) stream.enqueue(event);
      };

      const pump = async (container: DockerContainer, controller: AbortController) => {
        try {
          for await (const sample of streamContainerMetrics(container, controller.signal)) {
            push(sample);
          }
        } catch (error) {
          if (!controller.signal.aborted)
            console.error(`Metrics for ${container.Id} failed`, error);
        } finally {
          // A newer pump owns the id if the container was restarted in the meantime; its series must survive
          if (active.get(container.Id) === controller) {
            active.delete(container.Id);
            push({ type: "stopped", id: container.Id });
          }
        }
      };

      const reconcile = async () => {
        const running = (await listContainers()).filter((c) => c.State === "running");
        const runningIds = new Set(running.map((c) => c.Id));

        for (const [id, controller] of active) {
          if (!runningIds.has(id)) controller.abort();
        }
        for (const container of running) {
          if (active.has(container.Id) || closed) continue;
          const controller = new AbortController();
          active.set(container.Id, controller);
          void pump(container, controller);
        }
      };

      const abort = () => {
        if (closed) return;
        shutdown();
        stream.close();
      };
      // The abort event never fires for a signal that is already aborted
      if (signal.aborted) return abort();
      signal.addEventListener("abort", abort, { once: true });

      try {
        await reconcile();
      } catch (error) {
        // A failed start doesn't call `cancel`, so clean up here or the pumps would leak
        shutdown();
        throw error;
      }
      // The signal may have aborted while listing, which already shut everything down
      if (closed) return;
      timer = setInterval(() => {
        reconcile().catch((error) => console.error("Metrics reconcile failed", error));
      }, RECONCILE_MS);
      // The first sample takes a couple of seconds, so say up front if there won't be any
      if (active.size === 0) push({ type: "idle" });
    },
    cancel: shutdown,
  });
}
