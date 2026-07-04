import { readdir, exists, rm } from "node:fs/promises";
import { join } from "node:path";

import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

import { serverEnv } from "./env";

async function ensureAppsDirExists() {
  const appsDirExists = await exists(serverEnv.APPS_DIR);
  if (!appsDirExists) {
    await $`mkdir -p ${serverEnv.APPS_DIR}`;
  }
}

export const listReposFn = createServerFn().handler(async () => {
  await ensureAppsDirExists();
  return await readdir(serverEnv.APPS_DIR);
});

export const addRepoFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: repoUrl }) => {
    await ensureAppsDirExists();
    const result = await $`git clone ${repoUrl}`.cwd(serverEnv.APPS_DIR).quiet();
    return (result.stdout.toString() + result.stderr.toString()).trim();
  });

export const deleteRepoFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: repoName }) => {
    await ensureAppsDirExists();
    const repoPath = join(serverEnv.APPS_DIR, repoName);
    const repoExists = await exists(repoPath);
    if (!repoExists) {
      throw new Error(`Repo "${repoName}" does not exist.`);
    }
    await rm(repoPath, { recursive: true, force: true });
  });

// export const listRepoHistoryFn = createServerFn()
//   .validator(z.string())
//   .handler(async ({ data: repoPath }) => {
//     const history = await $`git -C ${repoPath} log --pretty=format:"%h - %an, %ar : %s"`.text();
//     return history.split("\n");
//   });
