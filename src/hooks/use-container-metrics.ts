import { useEffect, useReducer, useState } from "react";

import { applyMetricEvent } from "@/lib/metrics";
import { streamMetricsFn } from "@/lib/metrics.functions";
import type { ContainerSeries } from "@/lib/metrics.types";

const RETRY_MS = 3000;

/**
 * Subscribes to the live metrics stream and keeps a bounded history per container.
 *
 * @returns The series sorted by container name, and whether the stream has delivered its first event
 * since (re)connecting. Before that, an empty list just means "still loading".
 *
 * @remarks
 * Reconnects after a failure. History is kept across reconnects, which just shows up as a gap.
 */
export function useContainerMetrics() {
  const [state, dispatch] = useReducer(applyMetricEvent, {} as Record<string, ContainerSeries>);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function run() {
      while (true) {
        try {
          const stream = await streamMetricsFn({ signal });
          for await (const event of stream) {
            dispatch(event);
            setLoaded(true);
          }
        } catch (error) {
          if (!signal.aborted) console.error("Metrics stream failed", error);
        }
        if (signal.aborted) return;
        setLoaded(false);
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      }
    }
    void run();

    // Aborting closes the request, which makes the server stop its Docker streams
    return () => controller.abort();
  }, []);

  const series = Object.values(state).toSorted((a, b) => a.name.localeCompare(b.name));
  return { series, loaded };
}
