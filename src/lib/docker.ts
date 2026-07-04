import { createServerFn } from "@tanstack/react-start";
import { $ } from "bun";
import { z } from "zod";

// #region Docker System Info

const DockerSystemInfoSchema = z
  .object({
    Containers: z.number(),
    ContainersRunning: z.number(),
    ContainersPaused: z.number(),
    ContainersStopped: z.number(),
    Images: z.number(),
    OSType: z.string(),
    Architecture: z.string(),
  })
  .transform((info) => ({
    containers: info.Containers,
    containersRunning: info.ContainersRunning,
    containersPaused: info.ContainersPaused,
    containersStopped: info.ContainersStopped,
    images: info.Images,
    osType: info.OSType,
    architecture: info.Architecture,
  }));

export const dockerSystemInfoFn = createServerFn().handler(async () => {
  const info = await $`docker system info --format json`.json();
  return DockerSystemInfoSchema.parse(info);
});

// #endregion
