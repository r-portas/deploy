import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

import { listUpdates, runUpdate } from "./updates.server";

export const listUpdatesFn = createServerFn({ method: "GET" }).handler(() => listUpdates());

/**
 * Runs the OS's upgrade-everything command. Consume it with `for await`.
 */
export const runUpdateFn = createServerFn({ method: "GET" }).handler(async function* () {
  yield* runUpdate(getRequest().signal);
});
