import fs from "fs/promises";

// TODO: Needs a proper path eventually
export const REPO_DIR = "./repos";

/**
 * Ensures the repo directory exists
 */
export async function ensureRepoDirExists() {
  const exists = await fs.stat(REPO_DIR).catch(() => false);
  if (exists) {
    return;
  }

  await fs.mkdir(REPO_DIR, { recursive: true });
}
