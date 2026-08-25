import path from "path";

import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { listApps } from "./apps.server";
import { ensureRepoDirExists } from "./repos.server";
import { exec } from "./shell.server";

/**
 * Lists all apps found by recursively searching the repos directory for
 * Docker Compose files.
 */
export const listAppsFn = createServerFn().handler(async () => {
  await ensureRepoDirExists();
  return await listApps();
});

/**
 * Starts an app's compose stack, streaming each line of command output as
 * it's produced.
 */
export const startAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async function* ({ data: composeFilePath }) {
    const dir = path.dirname(composeFilePath);
    for await (const line of exec("docker compose up -d", { cwd: dir })) {
      yield line;
    }
  });

/**
 * Stops an app's compose stack, streaming each line of command output as
 * it's produced.
 */
export const stopAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async function* ({ data: composeFilePath }) {
    const dir = path.dirname(composeFilePath);
    for await (const line of exec("docker compose down", { cwd: dir })) {
      yield line;
    }
  });

/**
 * Restarts an app's compose stack, streaming each line of command output as
 * it's produced.
 */
export const restartAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async function* ({ data: composeFilePath }) {
    const dir = path.dirname(composeFilePath);
    for await (const line of exec("docker compose restart", { cwd: dir })) {
      yield line;
    }
  });

/**
 * Follows an app's compose stack logs, streaming each new line as it's
 * produced.
 *
 * @remarks
 * Runs indefinitely (`docker compose logs --follow`) until the client
 * disconnects — e.g. the caller closes the log view, which aborts the
 * request's signal and kills the underlying process. Without a client
 * still reading, this would otherwise leak a running process.
 */
export const logsAppFn = createServerFn({ method: "POST" })
  .validator(z.string())
  .handler(async function* ({ data: composeFilePath }) {
    const dir = path.dirname(composeFilePath);
    const signal = getRequest().signal;
    for await (const line of exec("docker compose logs --no-color --tail=200 --follow", {
      cwd: dir,
      signal,
    })) {
      yield line;
    }
  });
