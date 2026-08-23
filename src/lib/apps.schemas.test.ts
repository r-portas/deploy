import { describe, expect, test } from "bun:test";

import { parseLabels, parsePorts } from "./apps.schemas";

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

describe("parsePorts", () => {
  test("returns an empty array for an empty string", () => {
    expect(parsePorts("")).toEqual([]);
  });

  test("ignores an unpublished (exposed-only) port", () => {
    expect(parsePorts("80/tcp")).toEqual([]);
  });

  test("parses a single published port", () => {
    expect(parsePorts("0.0.0.0:8080->80/tcp")).toEqual(["8080"]);
  });

  test("dedupes IPv4 and IPv6 bindings for the same host port", () => {
    expect(parsePorts("0.0.0.0:8080->80/tcp, [::]:8080->80/tcp")).toEqual(["8080"]);
  });

  test("parses multiple published ports, sorted numerically", () => {
    expect(parsePorts("0.0.0.0:8081->81/tcp, 0.0.0.0:8080->80/tcp")).toEqual(["8080", "8081"]);
  });

  test("ignores unpublished ports mixed in with published ones", () => {
    expect(parsePorts("0.0.0.0:8080->80/tcp, 443/tcp")).toEqual(["8080"]);
  });
});
