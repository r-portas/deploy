import { z } from "zod";

const brewFormulaSchema = z.object({
  name: z.string(),
  installed_versions: z.array(z.string()),
  current_version: z.string(),
});

/**
 * Subset of `brew outdated --json=v2` output.
 */
export const brewOutdatedSchema = z.object({ formulae: z.array(brewFormulaSchema) });

export type BrewFormula = z.infer<typeof brewFormulaSchema>;
