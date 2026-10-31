import { z } from "zod";

import { dockerContainerSchema, dockerInfoSchema } from "./docker.schemas";
import type { DockerContainer } from "./docker.schemas";
import type { Stack } from "./docker.types";

const PROJECT_LABEL = "com.docker.compose.project";
const SERVICE_LABEL = "com.docker.compose.service";

const unix = "/var/run/docker.sock";

async function fetchDockerJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch("http://localhost" + path, { unix });
  if (!response.ok) {
    throw new Error(`Fetch '${path}' failed`);
  }
  return schema.parse(await response.json());
}

/**
 * Parses a newline-delimited JSON (NDJSON) byte stream into validated values.
 *
 * @param body - A response body whose lines are each one complete JSON document.
 * @param schema - Validates every line; a line that fails validation throws.
 *
 * @remarks
 * Network chunks don't line up with line boundaries, so partial lines are buffered until their
 * newline arrives. Blank lines are skipped, and a final line without a trailing newline is still parsed.
 *
 * @yields Each line parsed and validated against `schema`.
 */
export async function* parseNdjson<T>(
  body: ReadableStream<Uint8Array>,
  schema: z.ZodType<T>,
): AsyncGenerator<T> {
  // `stream: true` below keeps multibyte characters split across chunks intact
  const decoder = new TextDecoder();
  let buffer = "";

  const parseLine = (line: string) => schema.parse(JSON.parse(line));

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    // The last piece has no newline yet, so it may be incomplete
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) yield parseLine(line);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) yield parseLine(buffer);
}

/**
 * Opens a streaming Docker endpoint that responds with NDJSON, e.g. `/containers/{id}/stats`.
 *
 * @param path - Docker API path, including any query string.
 * @param schema - Validates each streamed value.
 * @param signal - Aborting it closes the connection to the Docker daemon.
 *
 * @yields Each streamed value, validated against `schema`.
 */
export async function* streamDockerJson<T>(
  path: string,
  schema: z.ZodType<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  const response = await fetch("http://localhost" + path, { unix, signal });
  if (!response.ok || !response.body) {
    throw new Error(`Stream '${path}' failed`);
  }
  yield* parseNdjson(response.body, schema);
}

export async function info() {
  return fetchDockerJson("/info", dockerInfoSchema);
}

/**
 * Lists all containers, including stopped ones so fully stopped stacks still show up.
 */
export async function listContainers() {
  return fetchDockerJson("/containers/json?all=true", z.array(dockerContainerSchema));
}

/**
 * Lists Compose stacks.
 */
export async function listStacks() {
  return groupStacks(await listContainers());
}

/**
 * Groups containers into Compose stacks using the labels Compose puts on every container it creates.
 *
 * @remarks
 * Containers without a Compose project label are ignored. Stacks and their services are sorted by name.
 */
export function groupStacks(containers: DockerContainer[]): Stack[] {
  const stacks = new Map<string, Stack>();

  for (const container of containers) {
    const project = container.Labels?.[PROJECT_LABEL];
    if (!project) continue;

    let stack = stacks.get(project);
    if (!stack) {
      stack = { name: project, services: [], runningCount: 0 };
      stacks.set(project, stack);
    }

    stack.services.push({
      id: container.Id,
      // Fall back to the container name for containers missing the service label
      name:
        container.Labels?.[SERVICE_LABEL] ?? container.Names[0]?.replace(/^\//, "") ?? container.Id,
      image: container.Image,
      state: container.State,
      status: container.Status,
    });
    if (container.State === "running") stack.runningCount++;
  }

  const sorted = [...stacks.values()].toSorted((a, b) => a.name.localeCompare(b.name));
  for (const stack of sorted) {
    stack.services.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}
