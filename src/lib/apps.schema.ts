import { z } from "zod";

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
    runningFor: container.RunningFor,
    size: container.Size,
    state: container.State,
    status: container.Status,
  }));

export type DockerContainer = z.infer<typeof dockerContainerSchema>;

export const dockerPsSchema = z.array(dockerContainerSchema);

/**
 * Parses `docker ps --format json` output, which is newline-delimited JSON
 * (one object per line), not a JSON array.
 */
export function parseDockerPsOutput(output: string): DockerContainer[] {
  const rawContainers = output
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line));

  return dockerPsSchema.parse(rawContainers);
}
