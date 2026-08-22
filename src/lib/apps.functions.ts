import path from "path";

import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

import { listApps } from "./apps.server";
import { ensureRepoDirExists } from "./repos.server";

/**
 * Lists all apps found by recursively searching the repos directory for
 * Docker Compose files.
 */
export const listAppsFn = createServerFn().handler(async () => {
  await ensureRepoDirExists();
  return await listApps();
});

export const startAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    const dir = path.dirname(composeFilePath);
    return await $`docker compose up -d`.cwd(dir).text();
  });

export const stopAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    const dir = path.dirname(composeFilePath);
    return await $`docker compose down`.cwd(dir).text();
  });

export const restartAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    const dir = path.dirname(composeFilePath);
    return await $`docker compose restart`.cwd(dir).text();
  });
