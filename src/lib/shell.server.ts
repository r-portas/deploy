import { spawn } from "bun";

/**
 * Buffers an async stream of chunks and yields complete lines.
 *
 * @param chunks - async iterable of string or byte chunks, e.g. raw stdout output
 * @yields Complete lines decoded from the chunk stream
 *
 * @remarks
 * A chunk boundary can land in the middle of a line, so raw chunks aren't
 * yielded directly. Any trailing partial line is flushed once `chunks` ends,
 * even if it has no trailing newline.
 */
export async function* linesFromChunks(chunks: AsyncIterable<string | Uint8Array>) {
  let buffer = "";

  for await (const chunk of chunks) {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    // Last element is the text after the final newline (possibly incomplete), so
    // hold it back and only yield the lines before it.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      yield line;
    }
  }

  if (buffer.length > 0) {
    yield buffer;
  }
}

/**
 * Runs a shell command and streams its output as complete lines.
 *
 * @param command - command string split on spaces into argv (no shell quoting)
 * @yields Lines from combined stdout and stderr
 *
 * @remarks
 * stderr is piped into stdout so both streams appear in the same line sequence.
 */
export async function* exec(command: string) {
  console.log("Executing command:", command);
  const process = spawn(command.split(" "), {
    // Pipe stderr to stdout
    stderr: 1,
  });

  yield* linesFromChunks(process.stdout);
}
