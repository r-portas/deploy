import { describe, expect, test } from "bun:test";
import path from "path";

import type { DockerContainer } from "./apps.schemas";
import { getComposeConfigFiles, matchContainersToApp } from "./apps.server";
import type { ComposeApp } from "./apps.types";

/**
 * Builds a minimal transformed `DockerContainer` for use as test fixture
 * input, with just enough fields for the matching logic under test.
 */
function container(overrides: Partial<DockerContainer> = {}): DockerContainer {
  return {
    command: "",
    createdAt: "",
    id: "container-id",
    image: "",
    labels: {},
    localVolumes: "",
    mounts: "",
    names: "",
    networks: "",
    ports: "",
    hostPorts: [],
    runningFor: "",
    size: "",
    state: "running",
    status: "",
    ...overrides,
  };
}

describe("getComposeConfigFiles", () => {
  test("returns an empty array when the label is absent", () => {
    expect(getComposeConfigFiles(container({}))).toEqual([]);
  });

  test("resolves a single config_files path", () => {
    expect(
      getComposeConfigFiles(
        container({
          labels: { "com.docker.compose.project.config_files": "repos/foo/compose.yaml" },
        }),
      ),
    ).toEqual([path.resolve("repos/foo/compose.yaml")]);
  });

  test("resolves multiple comma-separated config_files paths", () => {
    expect(
      getComposeConfigFiles(
        container({
          labels: {
            "com.docker.compose.project.config_files":
              "repos/foo/compose.yaml,repos/foo/compose.override.yaml",
          },
        }),
      ),
    ).toEqual([
      path.resolve("repos/foo/compose.yaml"),
      path.resolve("repos/foo/compose.override.yaml"),
    ]);
  });
});

describe("matchContainersToApp", () => {
  const app: ComposeApp = { name: "foo", path: "repos/foo/compose.yaml" };

  test("matches a container whose config_files label resolves to the app's path", () => {
    const matching = container({
      labels: { "com.docker.compose.project.config_files": "repos/foo/compose.yaml" },
    });

    expect(matchContainersToApp(app, [matching])).toEqual([matching]);
  });

  test("matches multiple containers sharing the same config_files label", () => {
    const web = container({
      labels: { "com.docker.compose.project.config_files": "repos/foo/compose.yaml" },
    });
    const worker = container({
      labels: { "com.docker.compose.project.config_files": "repos/foo/compose.yaml" },
    });

    expect(matchContainersToApp(app, [web, worker])).toEqual([web, worker]);
  });

  test("does not match a container from an unrelated compose file", () => {
    const unrelated = container({
      labels: { "com.docker.compose.project.config_files": "repos/other/compose.yaml" },
    });

    expect(matchContainersToApp(app, [unrelated])).toEqual([]);
  });

  test("only matches the compose file the app points to, not sibling candidates", () => {
    const dockerComposeApp: ComposeApp = {
      name: "foo",
      path: "repos/foo/docker-compose.yaml",
    };
    const usedByCompose = container({
      labels: { "com.docker.compose.project.config_files": "repos/foo/docker-compose.yaml" },
    });

    expect(matchContainersToApp(app, [usedByCompose])).toEqual([]);
    expect(matchContainersToApp(dockerComposeApp, [usedByCompose])).toEqual([usedByCompose]);
  });
});
