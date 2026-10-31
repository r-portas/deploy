import { z } from "zod";

const cpuStatsSchema = z.object({
  cpu_usage: z.object({ total_usage: z.number().optional() }).optional(),
  system_cpu_usage: z.number().optional(),
  online_cpus: z.number().optional(),
});

/**
 * Subset of a Docker Engine `GET /containers/{id}/stats` sample.
 * Nearly everything is optional as fields differ by cgroup version and are empty on the first sample.
 */
export const dockerStatsSchema = z.object({
  read: z.string(),
  cpu_stats: cpuStatsSchema,
  precpu_stats: cpuStatsSchema,
  memory_stats: z.object({
    usage: z.number().optional(),
    limit: z.number().optional(),
    stats: z.record(z.string(), z.number()).optional(),
  }),
  // Absent for containers on the `none` network or using host networking
  networks: z
    .record(z.string(), z.object({ rx_bytes: z.number(), tx_bytes: z.number() }))
    .optional(),
});

export type DockerStats = z.infer<typeof dockerStatsSchema>;
