import { createServerFn } from "@tanstack/react-start";

import { info, listStacks } from "./docker.server";

export const getDockerInfoFn = createServerFn({ method: "GET" }).handler(() => info());

export const getStacksFn = createServerFn({ method: "GET" }).handler(() => listStacks());
