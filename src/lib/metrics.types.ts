/** One point in time for a container. Rates are per second. */
export type MetricSample = {
  type: "sample";
  id: string;
  /** Container name without the leading slash. */
  name: string;
  /** Unix epoch in milliseconds, as reported by Docker. */
  time: number;
  /** CPU use as a percentage of one core, so 200 means two cores fully busy. */
  cpu: number;
  /** Memory in bytes, excluding reclaimable page cache. */
  memory: number;
  /** Memory limit in bytes. */
  memoryLimit: number;
  /** Bytes received per second, summed across networks. */
  rx: number;
  /** Bytes sent per second, summed across networks. */
  tx: number;
};

/** Sent when a container's stats stream ends, so the client can drop its series. */
export type MetricStopped = { type: "stopped"; id: string };

/** Sent once on connect when no containers are running, so the client can tell "none" from "not sampled yet". */
export type MetricIdle = { type: "idle" };

export type MetricEvent = MetricSample | MetricStopped | MetricIdle;

export type ContainerSeries = {
  id: string;
  name: string;
  samples: MetricSample[];
};
