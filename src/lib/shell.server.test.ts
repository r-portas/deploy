import { describe, expect, test } from "bun:test";
import { linesFromChunks } from "./shell.server";

async function* toChunks(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

async function collect(iterable: AsyncIterable<string>) {
  const lines: string[] = [];
  for await (const line of iterable) {
    lines.push(line);
  }
  return lines;
}

describe("linesFromChunks", () => {
  test("yields nothing for no chunks", async () => {
    expect(await collect(linesFromChunks(toChunks([])))).toEqual([]);
  });

  test("splits a single chunk into lines", async () => {
    const lines = await collect(linesFromChunks(toChunks(["hello\nworld\n"])));
    expect(lines).toEqual(["hello", "world"]);
  });

  test("joins a line split across multiple chunks", async () => {
    const lines = await collect(
      linesFromChunks(toChunks(["hel", "lo\nwor", "ld"])),
    );
    expect(lines).toEqual(["hello", "world"]);
  });

  test("flushes a trailing line with no newline", async () => {
    const lines = await collect(linesFromChunks(toChunks(["foo\nbar"])));
    expect(lines).toEqual(["foo", "bar"]);
  });

  test("handles multiple newlines within a single chunk", async () => {
    const lines = await collect(linesFromChunks(toChunks(["a\nb\nc\n"])));
    expect(lines).toEqual(["a", "b", "c"]);
  });

  test("ignores empty chunks", async () => {
    const lines = await collect(linesFromChunks(toChunks(["", "foo\n", ""])));
    expect(lines).toEqual(["foo"]);
  });

  test("yields empty lines for consecutive newlines", async () => {
    const lines = await collect(linesFromChunks(toChunks(["a\n\nb"])));
    expect(lines).toEqual(["a", "", "b"]);
  });
});
