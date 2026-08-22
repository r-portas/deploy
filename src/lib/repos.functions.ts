import fs from "fs/promises";

import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

import { ensureRepoDirExists, REPO_DIR } from "./repos.server";

/**
 * Lists all the repos in the repos directory
 */
export const listReposFn = createServerFn().handler(async () => {
  await ensureRepoDirExists();
  const repos = await fs.readdir(REPO_DIR);
  return repos.map((repo) => ({
    name: repo,
    path: `${REPO_DIR}/${repo}`,
  }));
});

export const cloneRepoFn = createServerFn()
  .validator(z.url())
  .handler(async ({ data: url }) => {
    await ensureRepoDirExists();
    return await $`git clone ${url}`.cwd(REPO_DIR).text();
  });
