import { describe, expect, test } from "bun:test";

import {
  applyMetricEvent,
  computeCpuPercent,
  computeMemoryBytes,
  formatBytes,
  MAX_SAMPLES,
  networkUnavailableReason,
  sumNetwork,
  toRate,
} from "./metrics";
import type { DockerStats } from "./metrics.schemas";
import type { MetricSample } from "./metrics.types";

function stats(overrides: Partial<DockerStats> = {}): DockerStats {
  return { read: "", cpu_stats: {}, precpu_stats: {}, memory_stats: {}, ...overrides };
}

function sample(id: string, time: number): MetricSample {
  return {
    type: "sample",
    id,
    name: id,
    networkMode: "bridge",
    time,
    cpu: 0,
    memory: 0,
    memoryLimit: 0,
    rx: 0,
    tx: 0,
  };
}

describe("computeCpuPercent", () => {
  test("scales the usage share by the number of CPUs", () => {
    const result = computeCpuPercent(
      stats({
        cpu_stats: { cpu_usage: { total_usage: 300 }, system_cpu_usage: 2000, online_cpus: 4 },
        precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 1000 },
      }),
    );
    // (200 / 1000) * 4 * 100
    expect(result).toBeCloseTo(80);
  });

  test("is 0 without a previous reading", () => {
    expect(
      computeCpuPercent(
        stats({ cpu_stats: { cpu_usage: { total_usage: 300 }, system_cpu_usage: 2000 } }),
      ),
    ).toBe(0);
  });
});

describe("computeMemoryBytes", () => {
  test("subtracts inactive_file on cgroup v2", () => {
    expect(
      computeMemoryBytes(stats({ memory_stats: { usage: 100, stats: { inactive_file: 30 } } })),
    ).toBe(70);
  });

  test("falls back to cache on cgroup v1", () => {
    expect(computeMemoryBytes(stats({ memory_stats: { usage: 100, stats: { cache: 40 } } }))).toBe(
      60,
    );
  });

  test("never goes negative", () => {
    expect(computeMemoryBytes(stats({ memory_stats: { usage: 10, stats: { cache: 40 } } }))).toBe(
      0,
    );
  });
});

describe("sumNetwork", () => {
  test("sums across networks", () => {
    expect(
      sumNetwork(
        stats({
          networks: { eth0: { rx_bytes: 1, tx_bytes: 2 }, eth1: { rx_bytes: 10, tx_bytes: 20 } },
        }),
      ),
    ).toEqual({ rx: 11, tx: 22 });
  });

  test("is zero when there are no networks", () => {
    expect(sumNetwork(stats())).toEqual({ rx: 0, tx: 0 });
  });
});

describe("networkUnavailableReason", () => {
  test("flags modes without their own network stats", () => {
    expect(networkUnavailableReason("host")).toBe("host networking");
    expect(networkUnavailableReason("none")).toBe("no network");
    expect(networkUnavailableReason("container:abc123")).toBe("shared network");
  });

  test("returns undefined for modes that report stats", () => {
    for (const mode of ["default", "bridge", "myproject_default"]) {
      expect(networkUnavailableReason(mode)).toBeUndefined();
    }
  });
});

describe("toRate", () => {
  test("divides the delta by the interval", () => {
    expect(toRate(300, 100, 2)).toBe(100);
  });

  test("is 0 when the counter reset or no time passed", () => {
    expect(toRate(5, 100, 1)).toBe(0);
    expect(toRate(100, 50, 0)).toBe(0);
  });
});

describe("applyMetricEvent", () => {
  test("appends samples per container and trims to the window", () => {
    let state = {};
    for (let i = 0; i < MAX_SAMPLES + 5; i++) state = applyMetricEvent(state, sample("a", i));
    state = applyMetricEvent(state, sample("b", 0));

    const series = state as ReturnType<typeof applyMetricEvent>;
    expect(series["a"]?.samples).toHaveLength(MAX_SAMPLES);
    expect(series["a"]?.samples[0]?.time).toBe(5);
    expect(series["b"]?.samples).toHaveLength(1);
  });

  test("removes a container's series when it stops", () => {
    const state = applyMetricEvent(applyMetricEvent({}, sample("a", 0)), {
      type: "stopped",
      id: "a",
    });
    expect(state).toEqual({});
  });
});

describe("formatBytes", () => {
  test("shows whole bytes without decimals", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1023)).toBe("1023 B");
  });

  test("switches unit at 1024 and keeps one decimal", () => {
    expect(formatBytes(1024)).toBe("1.0 KiB");
    expect(formatBytes(1536)).toBe("1.5 KiB");
    expect(formatBytes(1024 ** 2)).toBe("1.0 MiB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GiB");
  });

  test("stays in TiB for very large values", () => {
    expect(formatBytes(1024 ** 4)).toBe("1.0 TiB");
    expect(formatBytes(1024 ** 5)).toBe("1024.0 TiB");
  });
});
