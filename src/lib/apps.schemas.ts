import { z } from "zod";

// #region Parsers

/**
 * Parses Docker's `Labels` field, a comma-separated list of `key=value`
 * pairs, into a plain object.
 */
export function parseLabels(labels: string): Record<string, string> {
  if (!labels) return {};

  return Object.fromEntries(
    labels.split(",").map((label) => {
      const [key, ...rest] = label.split("=");
      return [key, rest.join("=")];
    }),
  );
}

/**
 * Parses Docker's `Ports` field into the distinct host ports an app exposes.
 *
 * @remarks
 * IPv4/IPv6 bindings for the same host port appear as separate entries
 * (e.g. `0.0.0.0:8080->80/tcp, [::]:8080->80/tcp`); these are deduped.
 * Entries with no host binding (e.g. `80/tcp`, exposed but not published)
 * are ignored since there's no host port to show.
 */
export function parsePorts(ports: string): string[] {
  const hostPorts = new Set<string>();

  for (const [, hostPort] of ports.matchAll(/:(\d+)->/g)) {
    // The capture group always matches when the regex matches, so this is defined.
    hostPorts.add(hostPort!);
  }

  return [...hostPorts].toSorted((a, b) => Number(a) - Number(b));
}

// #endregion

/**
 * Schema for a single container entry from `docker ps --format json`.
 *
 * @remarks
 * Docker's fields are PascalCase; this transforms them to camelCase and
 * parses the `Labels` string into a `Record<string, string>`.
 */
const dockerContainerSchema = z
  .object({
    Command: z.string(),
    CreatedAt: z.string(),
    ID: z.string(),
    Image: z.string(),
    Labels: z.string(),
    LocalVolumes: z.string(),
    Mounts: z.string(),
    Names: z.string(),
    Networks: z.string(),
    Ports: z.string(),
    RunningFor: z.string(),
    Size: z.string(),
    State: z.string(),
    Status: z.string(),
  })
  .transform((container) => ({
    command: container.Command,
    createdAt: container.CreatedAt,
    id: container.ID,
    image: container.Image,
    labels: parseLabels(container.Labels),
    localVolumes: container.LocalVolumes,
    mounts: container.Mounts,
    names: container.Names,
    networks: container.Networks,
    ports: container.Ports,
    hostPorts: parsePorts(container.Ports),
    runningFor: container.RunningFor,
    size: container.Size,
    state: container.State,
    status: container.Status,
  }));

export type DockerContainer = z.infer<typeof dockerContainerSchema>;
export const dockerPsSchema = z.array(dockerContainerSchema);
