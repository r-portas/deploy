import { dirname } from "node:path";

import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

import { serverEnv } from "./env";
import { runCommand } from "./shell";

const ComposeSummarySchema = z
  .object({
    Name: z.string(),
    Status: z.string(),
    // TODO: Why is this plural?
    ConfigFiles: z.string(),
  })
  .transform((composeSummary) => ({
    name: composeSummary.Name,
    status: composeSummary.Status,
    configFiles: composeSummary.ConfigFiles,
  }));
const ComposeSummariesSchema = z.array(ComposeSummarySchema);

/**
 * List apps that are currently running.
 */
export const listRunningAppsFn = createServerFn().handler(async () => {
  const result = await $`docker compose ls --format json`.quiet().text();
  return ComposeSummariesSchema.parse(JSON.parse(result));
});

/**
 * List available apps by searching for compose files in the apps directory.
 *
 * There is a max depth of 3 to avoid searching too deep into subdirectories.
 */
export const listAvailableAppsFn = createServerFn().handler(async () => {
  const results =
    await $`find ${serverEnv.APPS_DIR} -maxdepth 3 -name 'compose.yml' -o -name 'compose.yaml'`
      .quiet()
      .text();
  return results.split("\n").filter(Boolean);
});

export const getAppFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: appName }) => {
    const apps = await listRunningAppsFn();
    const app = apps.find((app) => app.name === appName);
    if (!app) {
      throw new Error(`App "${appName}" not found`);
    }

    return app;
  });

export const getAppLogsFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    return await $`docker compose logs --no-color --tail 1000`
      .cwd(dirname(composeFilePath))
      .quiet()
      .text();
  });

// #region App Lifecycle

export const startAppFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    return await runCommand(`docker compose up -d`, dirname(composeFilePath));
  });

export const stopAppFn = createServerFn()
  .validator(z.string())
  .handler(async ({ data: composeFilePath }) => {
    return await runCommand(`docker compose down`, dirname(composeFilePath));
  });

// #endregion
