import { readdir, exists, rm } from "node:fs/promises";
import { join } from "node:path";

import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

import { serverEnv } from "./env";

// #region Helpers

async function ensureAppsDirExists() {
  const appsDirExists = await exists(serverEnv.APPS_DIR);
  if (!appsDirExists) {
    await $`mkdir -p ${serverEnv.APPS_DIR}`;
  }
}

/**
 * Gets the full path to a repo by its name. Throws an error if the repo does not exist.
 *
 * @param repoName The repo name to get the path for
 * @returns The full path to the repo
 */
async function getRepoPath(repoName: string) {
  await ensureAppsDirExists();
  const repoPath = join(serverEnv.APPS_DIR, repoName);
  const repoExists = await exists(repoPath);
  if (!repoExists) {
    throw new Error(`Repo "${repoName}" does not exist.`);
  }
  return repoPath;
}

// #endregion

export interface RepoInfo {
  name: string;
  remoteUrl?: string;
  sha?: string;
}

export const listReposFn = createServerFn().handler(async (): Promise<RepoInfo[]> => {
  await ensureAppsDirExists();
  const repos = await readdir(serverEnv.APPS_DIR);
  return Promise.all(
    repos.map(async (repo) => {
      const repoPath = join(serverEnv.APPS_DIR, repo);
      let remoteUrl: string | undefined;
      let sha: string | undefined;

      try {
        remoteUrl = await $`git remote get-url origin`.cwd(repoPath).quiet().text();
        sha = await $`git rev-parse --short HEAD`.cwd(repoPath).quiet().text();
      } catch {
        console.error(
          `Failed to get remote URL or SHA for repo "${repo}". It may not be a valid git repository.`,
        );
      }

      return {
        name: repo,
        remoteUrl: remoteUrl?.trim(),
        sha: sha?.trim(),
      };
    }),
  );
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
    const repoPath = await getRepoPath(repoName);
    await rm(repoPath, { recursive: true, force: true });
  });

export const updateRepoFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: repoName }) => {
    const repoPath = await getRepoPath(repoName);
    const result = await $`git pull`.cwd(repoPath).quiet();
    return (result.stdout.toString() + result.stderr.toString()).trim();
  });

// export const listRepoHistoryFn = createServerFn()
//   .validator(z.string())
//   .handler(async ({ data: repoPath }) => {
//     const history = await $`git -C ${repoPath} log --pretty=format:"%h - %an, %ar : %s"`.text();
//     return history.split("\n");
//   });
