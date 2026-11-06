import { useState } from "react";

import { runUpdateFn } from "@/lib/updates.functions";

/**
 * Runs the upgrade-everything command and collects its output as it streams in.
 */
export function useRunUpdate() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setLog([]);
    try {
      const stream = await runUpdateFn();
      for await (const line of stream) {
        setLog((lines) => [...lines, line]);
      }
    } catch (error) {
      setLog((lines) => [
        ...lines,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ]);
    } finally {
      setRunning(false);
    }
  }

  return { log, running, run };
}
