import fs from "fs/promises";
import path from "path";

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

export type ComposeApp = {
  /**
   * The path to the app's Docker Compose file
   * @remarks
   * This is unique, so suitable to use as a id.
   */
  path: string;

  /**
   * The name of the app
   */
  name: string;
};

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

/**
 * Finds all Docker Compose apps across the cloned repos, using each compose
 * file's containing directory name as the app name.
 */
export async function listApps(): Promise<ComposeApp[]> {
  const composeFiles = await findComposeFiles(REPO_DIR);

  return composeFiles.map((filePath) => ({
    name: path.basename(path.dirname(filePath)),
    path: filePath,
  }));
}
