export type StackService = {
  id: string;
  /** Compose service name, e.g. `app`. */
  name: string;
  image: string;
  /** Engine state, e.g. `running`, `exited`, `paused`. */
  state: string;
  /** Human readable status, e.g. `Up 3 hours`. */
  status: string;
};

export type Stack = {
  /** Compose project name. */
  name: string;
  services: StackService[];
  runningCount: number;
};
