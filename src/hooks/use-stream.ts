import * as React from "react";

export type StreamStatus = "idle" | "streaming" | "success" | "error";

/**
 * Runs an async-generator function (e.g. a streaming server fn) and
 * accumulates its yielded items as React state.
 *
 * @param streamFn - function returning, or resolving to, an async iterable
 *
 * @remarks
 * `run` takes whatever arguments `streamFn` expects, e.g. a server fn's
 * `{ data }` payload. Each `run` call clears previous items before streaming
 * new ones; calling `run` again while already streaming starts a fresh run
 * and the caller is responsible for not racing overlapping calls.
 *
 * @example
 * ```ts
 * const restartApp = useServerFn(restartAppFn);
 * const { items, status, run } = useStream(restartApp);
 * await run({ data: app.path });
 * ```
 */
export default function useStream<TArgs extends unknown[], TItem>(
  streamFn: (...args: TArgs) => Promise<AsyncIterable<TItem>> | AsyncIterable<TItem>,
) {
  const [items, setItems] = React.useState<TItem[]>([]);
  const [status, setStatus] = React.useState<StreamStatus>("idle");
  const [error, setError] = React.useState<Error | undefined>(undefined);

  const run = React.useCallback(
    async (...args: TArgs) => {
      setItems([]);
      setError(undefined);
      setStatus("streaming");

      try {
        const stream = await streamFn(...args);
        for await (const item of stream) {
          setItems((prev) => [...prev, item]);
        }
        setStatus("success");
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        setStatus("error");
        // Re-throw so callers can still handle failure with try/catch.
        throw normalized;
      }
    },
    [streamFn],
  );

  const reset = React.useCallback(() => {
    setItems([]);
    setStatus("idle");
    setError(undefined);
  }, []);

  return { items, status, error, run, reset };
}
