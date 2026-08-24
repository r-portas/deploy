import { spawn } from "bun";

/**
 * Buffers an async stream of chunks and yields complete lines.
 *
 * @param chunks - async iterable of byte chunks, e.g. raw stdout output
 * @yields Complete lines decoded from the chunk stream
 *
 * @remarks
 * A chunk boundary can land in the middle of a line (or even mid multi-byte
 * UTF-8 character), so raw chunks aren't yielded directly. Chunks are decoded
 * as UTF-8 via `TextDecoder`, not `Uint8Array#toString`, which joins raw byte
 * values with commas instead of decoding text. Any trailing partial line is
 * flushed once `chunks` ends, even if it has no trailing newline.
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
 * Runs a shell command and streams its output as complete lines.
 *
 * @param command - command string split on spaces into argv (no shell quoting)
 * @param options.cwd - working directory to run the command in
 * @yields Lines from combined stdout and stderr, followed by an
 * `Exit code <number>` line once the process exits
 *
 * @remarks
 * stderr is piped into stdout so both streams appear in the same line sequence.
 */
export async function* exec(command: string, options?: { cwd?: string }) {
  const process = spawn(command.split(" "), {
    ...(options?.cwd ? { cwd: options.cwd } : {}),
    // Pipe stderr to stdout
    stderr: 1,
  });

  yield* linesFromChunks(process.stdout);

  const exitCode = await process.exited;
  yield `Exit code ${exitCode}`;
}
