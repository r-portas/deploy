import { $ } from "bun";

/**
 * Runs a shell command and returns the output as an array of strings, one for each line of output.
 * The stdout and stderr are combined into a single output.
 * @param command The command to run
 * @param cwd The current working directory to run the command in
 * @returns The output of the command as an array of strings, one for each line of output
 */
export async function runCommand(command: string, cwd?: string): Promise<string[]> {
  console.log(`Running command: ${command} in ${cwd ?? process.cwd()}`);
  const result = await $`${{ raw: command }} 2>&1`
    .cwd(cwd ?? process.cwd())
    .nothrow()
    .text();
  console.log(result);

  return result.trim().split("\n");
}
