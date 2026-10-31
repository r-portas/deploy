import { z } from "zod";

/**
 * Subset of the Docker Engine `GET /info` response that the app uses.
 * Unknown keys are stripped, so new engine fields won't break parsing.
 */
export const dockerInfoSchema = z.object({
  ID: z.string(),
  Name: z.string(),
  ServerVersion: z.string(),
  OperatingSystem: z.string(),
  OSType: z.string(),
  Architecture: z.string(),
  KernelVersion: z.string(),
  NCPU: z.number(),
  MemTotal: z.number(),
  Containers: z.number(),
  ContainersRunning: z.number(),
  ContainersPaused: z.number(),
  ContainersStopped: z.number(),
  Images: z.number(),
});

export type DockerInfo = z.infer<typeof dockerInfoSchema>;

/**
 * Subset of an item from the Docker Engine `GET /containers/json` response.
 * `Labels` can be null for containers created without any.
 */
export const dockerContainerSchema = z.object({
  Id: z.string(),
  Names: z.array(z.string()),
  Image: z.string(),
  State: z.string(),
  Status: z.string(),
  Labels: z.record(z.string(), z.string()).nullable(),
  HostConfig: z.object({
    // Free-form: `default`, `bridge`, `host`, `none`, `container:<id>` or a user-defined network name
    NetworkMode: z.string(),
  }),
});

export type DockerContainer = z.infer<typeof dockerContainerSchema>;
