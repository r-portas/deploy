import { describe, expect, test } from "bun:test";

import { mapBrewFormulae, parseAptUpgradable } from "./updates.server";

describe("parseAptUpgradable", () => {
  test("parses upgradable packages, ignoring the header line", () => {
    const output = [
      "Listing...",
      "nginx/stable 1.18.0-6.1 amd64 [upgradable from: 1.18.0-6]",
      "curl/stable 7.74.0-1.3+deb11u13 amd64 [upgradable from: 7.74.0-1.3+deb11u11]",
    ].join("\n");

    expect(parseAptUpgradable(output)).toEqual([
      { name: "nginx", currentVersion: "1.18.0-6", newVersion: "1.18.0-6.1" },
      { name: "curl", currentVersion: "7.74.0-1.3+deb11u11", newVersion: "7.74.0-1.3+deb11u13" },
    ]);
  });

  test("returns an empty list when nothing is upgradable", () => {
    expect(parseAptUpgradable("Listing...\n")).toEqual([]);
  });
});

describe("mapBrewFormulae", () => {
  test("maps the latest installed version and the available version", () => {
    const formulae = [
      { name: "node", installed_versions: ["20.1.0"], current_version: "20.2.0" },
      { name: "jq", installed_versions: ["1.6", "1.7.1"], current_version: "1.7.2" },
    ];

    expect(mapBrewFormulae(formulae)).toEqual([
      { name: "node", currentVersion: "20.1.0", newVersion: "20.2.0" },
      { name: "jq", currentVersion: "1.7.1", newVersion: "1.7.2" },
    ]);
  });
});
