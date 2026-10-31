import { describe, expect, test } from "bun:test";

import { groupDashboardServices } from "./dashboard.server";
import type { DockerContainer } from "./docker.schemas";

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

function labelled(labels: Record<string, string>, overrides: Partial<DockerContainer> = {}) {
  return container({ Labels: labels, ...overrides });
}

describe("groupDashboardServices", () => {
  test("groups and sorts by group and name", () => {
    const groups = groupDashboardServices([
      labelled({
        "homepage.group": "Media",
        "homepage.name": "Emby",
        "homepage.href": "http://emby.home/",
      }),
      labelled({
        "homepage.group": "Admin",
        "homepage.name": "Portainer",
        "homepage.href": "http://p.home/",
      }),
      labelled({
        "homepage.group": "Media",
        "homepage.name": "Bazarr",
        "homepage.href": "http://b.home/",
      }),
    ]);

    expect(groups.map((g) => g.name)).toEqual(["Admin", "Media"]);
    expect(groups[1]?.services.map((s) => s.name)).toEqual(["Bazarr", "Emby"]);
  });

  test("includes the description when present", () => {
    const [group] = groupDashboardServices([
      labelled({
        "homepage.group": "Media",
        "homepage.name": "Emby",
        "homepage.href": "http://emby.home/",
        "homepage.description": "Media server",
      }),
    ]);
    expect(group?.services[0]).toEqual({
      name: "Emby",
      href: "http://emby.home/",
      description: "Media server",
      state: "running",
      status: "Up 1 hour",
    });
  });

  test("puts services without a group in Other", () => {
    const [group] = groupDashboardServices([
      labelled({ "homepage.name": "Emby", "homepage.href": "http://emby.home/" }),
    ]);
    expect(group?.name).toBe("Other");
  });

  test("keeps stopped containers with their state and status", () => {
    const [group] = groupDashboardServices([
      labelled(
        { "homepage.name": "A", "homepage.href": "http://a.home/" },
        { State: "exited", Status: "Exited (0) 2 hours ago" },
      ),
    ]);
    expect(group?.services[0]).toMatchObject({ state: "exited", status: "Exited (0) 2 hours ago" });
  });

  test("skips null labels and missing name or href", () => {
    expect(
      groupDashboardServices([
        container({ Labels: null }),
        labelled({ "homepage.href": "http://b.home/" }),
        labelled({ "homepage.name": "C" }),
      ]),
    ).toEqual([]);
  });

  test("skips non-http(s) and invalid hrefs", () => {
    expect(
      groupDashboardServices([
        labelled({ "homepage.name": "A", "homepage.href": "javascript:alert(1)" }),
        labelled({ "homepage.name": "B", "homepage.href": "not a url" }),
      ]),
    ).toEqual([]);
  });

  test("keeps hrefs that use the origin placeholder", () => {
    const [group] = groupDashboardServices([
      labelled({ "homepage.name": "Glances", "homepage.href": "{{HOMEPAGE_VAR_URL}}:61208" }),
    ]);
    expect(group?.services[0]?.href).toBe("{{HOMEPAGE_VAR_URL}}:61208");
  });
});
