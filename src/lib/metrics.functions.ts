import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { streamMetrics } from "./metrics.server";

/**
 * Streams live metrics for all running containers. Consume it with `for await`.
 */
export const streamMetricsFn = createServerFn({ method: "GET" }).handler(async function* () {
  // The request aborts when the client disconnects, which is what ends the stream
  yield* streamMetrics(getRequest().signal);
});
