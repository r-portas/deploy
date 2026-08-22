import { describe, expect, test } from "bun:test";

import { parseLabels } from "./apps.schema";

describe("parseLabels", () => {
  test("returns an empty object for an empty string", () => {
    expect(parseLabels("")).toEqual({});
  });

  test("parses a single key=value pair", () => {
    expect(parseLabels("com.docker.compose.project=myapp")).toEqual({
      "com.docker.compose.project": "myapp",
    });
  });

  test("parses multiple comma-separated key=value pairs", () => {
    expect(
      parseLabels("com.docker.compose.project=myapp,com.docker.compose.service=web"),
    ).toEqual({
      "com.docker.compose.project": "myapp",
      "com.docker.compose.service": "web",
    });
  });

  test("preserves '=' characters within a value", () => {
    expect(parseLabels("com.docker.compose.config-hash=abc123=def456")).toEqual({
      "com.docker.compose.config-hash": "abc123=def456",
    });
  });

  test("treats a valueless key as an empty string", () => {
    expect(parseLabels("com.docker.compose.project=")).toEqual({
      "com.docker.compose.project": "",
    });
  });
});
