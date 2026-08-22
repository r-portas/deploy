import { describe, expect, test } from "bun:test";

import { parseDockerPsOutput, parseLabels } from "./apps.schema";

/**
 * Builds a raw `docker ps --format json` line (Docker's PascalCase shape)
 * for use as test fixture input.
 */
function dockerPsLine(overrides: Partial<Record<string, string>> = {}): string {
  return JSON.stringify({
    Command: '"/bin/sh"',
    CreatedAt: "2024-01-01 00:00:00 +0000 UTC",
    ID: "abc123",
    Image: "nginx:latest",
    Labels: "com.docker.compose.project=myapp",
    LocalVolumes: "0",
    Mounts: "",
    Names: "myapp-web-1",
    Networks: "myapp_default",
    Ports: "",
    RunningFor: "2 hours ago",
    Size: "0B",
    State: "running",
    Status: "Up 2 hours",
    ...overrides,
  });
}

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
    expect(parseLabels("com.docker.compose.project=myapp,com.docker.compose.service=web")).toEqual({
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

describe("parseDockerPsOutput", () => {
  test("returns an empty array for an empty string", () => {
    expect(parseDockerPsOutput("")).toEqual([]);
  });

  test("ignores a trailing newline", () => {
    expect(parseDockerPsOutput(`${dockerPsLine()}\n`)).toHaveLength(1);
  });

  test("parses a single line into a transformed container", () => {
    const [container] = parseDockerPsOutput(dockerPsLine({ ID: "abc123", State: "running" }));

    expect(container).toMatchObject({
      id: "abc123",
      state: "running",
      labels: { "com.docker.compose.project": "myapp" },
    });
  });

  test("parses multiple newline-delimited lines", () => {
    const output = [dockerPsLine({ ID: "container-1" }), dockerPsLine({ ID: "container-2" })].join(
      "\n",
    );

    const containers = parseDockerPsOutput(output);

    expect(containers.map((container) => container.id)).toEqual(["container-1", "container-2"]);
  });
});
