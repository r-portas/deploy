import { describe, expect, test } from "bun:test";

import { z } from "zod";

import type { DockerContainer } from "./docker.schemas";
import { groupStacks, parseNdjson } from "./docker.server";

function container(overrides: Partial<DockerContainer>): DockerContainer {
  return {
    Id: "id",
    Names: ["/name"],
    Image: "img",
    State: "running",
    Status: "Up 1 hour",
    Labels: {},
    HostConfig: { NetworkMode: "default" },
    ...overrides,
  };
}

describe("groupStacks", () => {
  test("groups by project, sorts, and counts running services", () => {
    const stacks = groupStacks([
      container({
        Id: "1",
        Labels: { "com.docker.compose.project": "web", "com.docker.compose.service": "db" },
      }),
      container({
        Id: "2",
        State: "exited",
        Labels: { "com.docker.compose.project": "web", "com.docker.compose.service": "app" },
      }),
      container({
        Id: "3",
        Labels: { "com.docker.compose.project": "api", "com.docker.compose.service": "app" },
      }),
    ]);

    expect(stacks.map((s) => s.name)).toEqual(["api", "web"]);
    expect(stacks[1]?.services.map((s) => s.name)).toEqual(["app", "db"]);
    expect(stacks[1]?.runningCount).toBe(1);
  });

  test("ignores containers outside Compose, including null labels", () => {
    // Docker returns null (not {}) for containers created without labels
    const unlabelled = container({ Labels: null });
    expect(groupStacks([unlabelled, container({ Labels: { foo: "bar" } })])).toEqual([]);
  });

  test("falls back to the container name without a service label", () => {
    const [stack] = groupStacks([
      container({ Names: ["/solo"], Labels: { "com.docker.compose.project": "p" } }),
    ]);
    expect(stack?.services[0]?.name).toBe("solo");
  });
});

function streamOf(...chunks: (string | Uint8Array)[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
}

describe("parseNdjson", () => {
  const schema = z.object({ n: z.number() });

  async function collect(stream: ReadableStream<Uint8Array>) {
    const values: { n: number }[] = [];
    for await (const value of parseNdjson(stream, schema)) values.push(value);
    return values;
  }

  test("parses one value per line", async () => {
    expect(await collect(streamOf('{"n":1}\n{"n":2}\n'))).toEqual([{ n: 1 }, { n: 2 }]);
  });

  test("joins lines split across chunks", async () => {
    expect(await collect(streamOf('{"n":', "1}\n{", '"n":2}\n'))).toEqual([{ n: 1 }, { n: 2 }]);
  });

  test("keeps multibyte characters split across chunks intact", async () => {
    const textSchema = z.object({ s: z.string() });
    const bytes = new TextEncoder().encode('{"s":"é"}\n');
    // Split in the middle of the two-byte "é"
    const split = bytes.indexOf(0xc3) + 1;
    const stream = streamOf(bytes.slice(0, split), bytes.slice(split));
    const values = [];
    for await (const value of parseNdjson(stream, textSchema)) values.push(value);
    expect(values).toEqual([{ s: "é" }]);
  });

  test("parses a final line without a trailing newline and skips blank lines", async () => {
    expect(await collect(streamOf('{"n":1}\n\n{"n":2}'))).toEqual([{ n: 1 }, { n: 2 }]);
  });

  test("throws when a line fails the schema", async () => {
    expect(collect(streamOf('{"n":"x"}\n'))).rejects.toThrow();
  });
});
