import { createServerFn } from "@tanstack/react-start";

import { listDashboardGroups } from "./dashboard.server";

export const getDashboardFn = createServerFn({ method: "GET" }).handler(() =>
  listDashboardGroups(),
);
