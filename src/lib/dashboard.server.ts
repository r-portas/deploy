import type { DashboardGroup } from "./dashboard.types";
import type { DockerContainer } from "./docker.schemas";
import { listContainers } from "./docker.server";

const GROUP_LABEL = "homepage.group";
const NAME_LABEL = "homepage.name";
const HREF_LABEL = "homepage.href";
const DESCRIPTION_LABEL = "homepage.description";

const DEFAULT_GROUP = "Other";

/**
 * Lists services that opt in to the dashboard via `homepage.*` labels, grouped by category.
 */
export async function listDashboardGroups() {
  return groupDashboardServices(await listContainers());
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Builds dashboard groups from the `homepage.*` labels (the same ones gethomepage.dev uses).
 *
 * @remarks
 * Containers that lack a name or href, or have a non-http(s) href, are skipped. Stopped
 * containers are kept so their state is visible.
 * The href check stops a label from injecting a `javascript:` link. Services without a group
 * land in "Other". Groups and their services are sorted by name.
 */
export function groupDashboardServices(containers: DockerContainer[]): DashboardGroup[] {
  const groups = new Map<string, DashboardGroup>();

  for (const container of containers) {
    const labels = container.Labels;
    const name = labels?.[NAME_LABEL];
    const href = labels?.[HREF_LABEL];
    if (!name || !href || !isHttpUrl(href)) continue;

    const groupName = labels[GROUP_LABEL] || DEFAULT_GROUP;
    let group = groups.get(groupName);
    if (!group) {
      group = { name: groupName, services: [] };
      groups.set(groupName, group);
    }

    group.services.push({
      name,
      href,
      description: labels[DESCRIPTION_LABEL] || undefined,
      state: container.State,
      status: container.Status,
    });
  }

  const sorted = [...groups.values()].toSorted((a, b) => a.name.localeCompare(b.name));
  for (const group of sorted) {
    group.services.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}
