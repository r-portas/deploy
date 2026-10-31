import { z } from "zod";

import { dockerContainerSchema, dockerInfoSchema } from "./docker.schemas";
import type { DockerContainer } from "./docker.schemas";
import type { Stack } from "./docker.types";

const PROJECT_LABEL = "com.docker.compose.project";
const SERVICE_LABEL = "com.docker.compose.service";

const unix = "/var/run/docker.sock";

async function fetchDockerJson(path: string): Promise<unknown> {
  const response = await fetch("http://localhost" + path, { unix });
  if (!response.ok) {
    throw new Error(`Fetch '${path}' failed`);
  }
  return response.json();
}

export async function info() {
  const resp = await fetchDockerJson("/info");
  return dockerInfoSchema.parse(resp);
}

/**
 * Lists all containers, including stopped ones so fully stopped stacks still show up.
 */
export async function listContainers() {
  const resp = await fetchDockerJson("/containers/json?all=true");
  return z.array(dockerContainerSchema).parse(resp);
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
