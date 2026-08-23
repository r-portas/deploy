import fs from "fs/promises";
import path from "path";

import { $ } from "bun";

import { type DockerContainer, dockerPsSchema } from "./apps.schemas";
import type { ComposeApp, App } from "./apps.types";
import { REPO_DIR } from "./repos.server";

/**
 * Valid Docker Compose file names, per the Compose Specification.
 * @see https://docs.docker.com/compose/intro/compose-application-model/#the-compose-file
 */
const COMPOSE_FILE_NAMES = [
  "compose.yaml",
  "compose.yml",
  "docker-compose.yaml",
  "docker-compose.yml",
];

/**
 * Recursively walks a directory tree and returns the path of every Docker
 * Compose file found.
 *
 * @remarks
 * Skips `.git` directories to avoid wasted work on repo internals.
 */
async function findComposeFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      const composeFiles = await findComposeFiles(entryPath);
      files.push(...composeFiles);
    } else if (COMPOSE_FILE_NAMES.includes(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

const COMPOSE_CONFIG_FILES_LABEL = "com.docker.compose.project.config_files";

/**
 * Reads the compose file path(s) a container was created from, via Docker
 * Compose's `config_files` label (comma-separated when multiple `-f` flags
 * were used).
 */
export function getComposeConfigFiles(container: DockerContainer): string[] {
  const label = container.labels[COMPOSE_CONFIG_FILES_LABEL];
  if (!label) return [];

  return label.split(",").map((configFile) => path.resolve(configFile));
}

/**
 * Finds the containers belonging to an app's compose file.
 *
 * @remarks
 * Matches on the `config_files` label rather than the compose project name
 * or working directory, since it's the only one guaranteed to identify the
 * exact compose file(s) Docker Compose used.
 */
export function matchContainersToApp(
  app: ComposeApp,
  containers: DockerContainer[],
): DockerContainer[] {
  const appPath = path.resolve(app.path);

  return containers.filter((container) => getComposeConfigFiles(container).includes(appPath));
}

async function getRunningContainers(): Promise<DockerContainer[]> {
  const output = await $`docker ps --format json`.text();
  const rawContainers = output
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => JSON.parse(line));

  return dockerPsSchema.parse(rawContainers);
}

/**
 * Finds all Docker Compose apps across the cloned repos, using each compose
 * file's containing directory name as the app name, merged with each app's
 * live container status from `docker ps`.
 */
export async function listApps(): Promise<App[]> {
  const [composeFiles, containers] = await Promise.all([
    findComposeFiles(REPO_DIR),
    getRunningContainers(),
  ]);

  return composeFiles.map((filePath) => {
    const app: ComposeApp = {
      name: path.basename(path.dirname(filePath)),
      path: filePath,
    };
    const matched = matchContainersToApp(app, containers);

    return {
      ...app,
      running: matched.length > 0,
      containers: matched,
      ports: matched.map((container) => container.hostPorts).flat(),
    };
  });
}
