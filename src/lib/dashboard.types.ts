export type DashboardService = {
  name: string;
  /** Absolute http(s) URL the service is reachable at, optionally containing `{{HOMEPAGE_VAR_URL}}`. */
  href: string;
  description?: string | undefined;
  /** Engine state, e.g. `running`, `exited`. */
  state: string;
  /** Human readable status, e.g. `Up 3 hours`. */
  status: string;
};

export type DashboardGroup = {
  name: string;
  services: DashboardService[];
};
