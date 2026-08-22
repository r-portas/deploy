import { z } from "zod";

const serverEnvSchema = z.object({
  APPS_DIR: z.string().default("/tmp/deploy"),
});

export const serverEnv = serverEnvSchema.parse(process.env);
