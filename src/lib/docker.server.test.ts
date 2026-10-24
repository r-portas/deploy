import { describe, expect, test } from "bun:test";

import type { DockerContainer } from "./docker.schemas";
import { groupStacks } from "./docker.server";

function container(overrides: Partial<DockerContainer>): DockerContainer {
  return {
    Id: "id",
    Names: ["/name"],
    Image: "img",
    State: "running",
    Status: "Up 1 hour",
    Labels: {},
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
