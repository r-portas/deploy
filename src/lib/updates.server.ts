import { brewOutdatedSchema } from "./updates.schemas";
import type { BrewFormula } from "./updates.schemas";
import type { PackageUpdate } from "./updates.types";

const APT_UPGRADABLE_LINE =
  /^(?<name>\S+)\/\S+\s+(?<newVersion>\S+)\s+\S+\s+\[upgradable from:\s*(?<currentVersion>\S+)\]$/;

/**
 * Splits a byte stream into text lines, decoding as it goes.
 *
 * @yields Each complete line, plus a final partial one if the stream ends without a trailing newline.
 */
async function* streamLines(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of stream) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    yield* lines;
  }

  buffer += decoder.decode();
  if (buffer) yield buffer;
}

/**
 * Runs a command as the host rather than inside this container, via `nsenter` into the host's
 * PID 1 namespaces.
 *
 * @remarks
 * Only resolves to the host when this app is deployed `privileged` with `pid: host` (see
 * compose.yaml) — without host PID visibility, target `1` is this container's own init instead.
 * Uses short flags because the release image is `oven/bun:1-alpine`, whose `nsenter` is BusyBox's
 * applet, not util-linux's — it doesn't understand `--target`/`--mount`/etc.
 */
function runOnHost(command: string, options: { signal?: AbortSignal } = {}) {
  return Bun.spawn(["nsenter", "-t", "1", "-m", "-u", "-i", "-n", "--", "sh", "-c", command], {
    stdout: "pipe",
    stderr: "pipe",
    // Stops apt from prompting (e.g. on config file conflicts), which would otherwise hang forever
    // since there's no terminal attached to answer it
    env: { ...process.env, DEBIAN_FRONTEND: "noninteractive" },
    ...options,
  });
}

/**
 * Runs a one-shot command and returns its stdout.
 *
 * @throws If the command exits non-zero, with its stdout and stderr included (e.g. a missing
 * binary), so a broken environment surfaces as an error instead of silently looking like there's
 * nothing to do.
 */
async function runChecked(proc: {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  exited: Promise<number>;
}): Promise<string> {
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  if (exitCode !== 0) {
    throw new Error(`Command failed (exit ${exitCode}): ${(stdout + stderr).trim()}`);
  }
  return stdout;
}

/**
 * Parses `apt list --upgradable` output into package updates.
 *
 * @remarks
 * Ignores the "Listing..." header line and anything else that doesn't match the upgradable format.
 */
export function parseAptUpgradable(output: string): PackageUpdate[] {
  const updates: PackageUpdate[] = [];
  for (const line of output.split("\n")) {
    const { name, newVersion, currentVersion } =
      line.trim().match(APT_UPGRADABLE_LINE)?.groups ?? {};
    if (name && newVersion && currentVersion) updates.push({ name, currentVersion, newVersion });
  }
  return updates;
}

/** Maps `brew outdated --json=v2` formulae into package updates. */
export function mapBrewFormulae(formulae: BrewFormula[]): PackageUpdate[] {
  return formulae.map((formula) => ({
    name: formula.name,
    currentVersion: formula.installed_versions.at(-1) ?? "",
    newVersion: formula.current_version,
  }));
}

/**
 * Lists available package updates.
 *
 * @remarks
 * Each platform's package index is refreshed first so the list is never stale, at the cost of a
 * slower load.
 */
export async function listUpdates(): Promise<PackageUpdate[]> {
  switch (process.platform) {
    case "darwin": {
      await runChecked(Bun.spawn(["brew", "update"], { stdout: "pipe", stderr: "pipe" }));
      const output = await runChecked(
        Bun.spawn(["brew", "outdated", "--json=v2"], { stdout: "pipe", stderr: "pipe" }),
      );
      return mapBrewFormulae(brewOutdatedSchema.parse(JSON.parse(output)).formulae);
    }
    case "linux": {
      await runChecked(runOnHost("apt-get update"));
      const output = await runChecked(runOnHost("apt list --upgradable"));
      return parseAptUpgradable(output);
    }
    default:
      throw new Error(`Unsupported platform for software updates: ${process.platform}`);
  }
}

export function runUpdate(signal: AbortSignal): AsyncGenerator<string> {
  switch (process.platform) {
    case "darwin": {
      const proc = Bun.spawn(["sh", "-c", "brew upgrade 2>&1"], { stdout: "pipe", signal });
      return streamLines(proc.stdout);
    }
    case "linux": {
      // stderr is merged into stdout (2>&1) so the log shows output in the order apt produced it
      const proc = runOnHost("apt-get -y upgrade 2>&1", { signal });
      return streamLines(proc.stdout);
    }
    default:
      throw new Error(`Unsupported platform for software updates: ${process.platform}`);
  }
}
