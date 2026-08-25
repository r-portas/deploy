import { spawn, type Spawn } from "bun";

/**
 * Decodes a byte stream into complete lines, buffering across chunk
 * boundaries (including mid-UTF-8 characters).
 *
 * @yields Decoded lines. A trailing partial line is flushed when `chunks` ends.
 *
 * @remarks
 * Uses `TextDecoder`, not `Uint8Array#toString` (which joins raw byte values
 * with commas).
 *
 * @example
 * for await (const line of linesFromChunks(process.stdout)) {
 *   console.log(line);
 * }
 */
export async function* linesFromChunks(chunks: AsyncIterable<Uint8Array>) {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of chunks) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split("\n");
    // Last element is the text after the final newline (possibly incomplete), so
    // hold it back and only yield the lines before it.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      yield line;
    }
  }

  // Flush any bytes withheld by the decoder pending a completed multi-byte sequence.
  buffer += decoder.decode();

  if (buffer.length > 0) {
    yield buffer;
  }
}

/**
 * Runs a command and yields combined stdout/stderr as lines, then
 * `Exit code <n>` unless the caller aborted `signal`.
 *
 * @yields Combined stdout/stderr lines, then `Exit code <n>` unless aborted
 *
 * @remarks
 * `command` is split on spaces — no quoting. Aborting `signal` kills the
 * process and skips the exit-code line. The `finally` kill is a fallback
 * if the caller stops iterating without aborting.
 *
 * @example
 * for await (const line of exec("docker compose up -d", { cwd: dir })) {
 *   console.log(line);
 * }
 */
export async function* exec(command: string, options?: Spawn.SpawnOptions<"ignore", "pipe", 1>) {
  const process = spawn(command.split(" "), {
    ...options,
    // Merge stderr into the stdout stream we read below.
    stderr: 1,
  });

  try {
    yield* linesFromChunks(process.stdout);

    // Process was killed on purpose; don't yield an exit-code line.
    if (options?.signal?.aborted) return;

    const exitCode = await process.exited;

    yield "";
    yield `Exit code ${exitCode}`;
  } finally {
    // Stops a still-running child if the caller dropped the generator.
    process.kill();
  }
}
