import { AppShell, Group, NavLink, Stack, ThemeIcon, Title } from "@mantine/core";
import { AirTrafficControlIcon } from "@phosphor-icons/react";
import { Link, useMatchRoute, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV_ITEMS: { label: string; to: LinkProps["to"] }[] = [
  { label: "Home", to: "/" },
  { label: "Apps", to: "/apps" },
  { label: "Repos", to: "/repos" },
];

export function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  const matchRoute = useMatchRoute();

  return (
    <AppShell layout="alt" navbar={{ width: 240, breakpoint: 0 }} padding="md">
      <AppShell.Navbar p="md">
        <Stack gap="md">
          <Group gap="sm">
            <ThemeIcon>
              <AirTrafficControlIcon />
            </ThemeIcon>
            <Title order={5}>Deploy</Title>
          </Group>
          <Stack gap={4}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                component={Link}
                to={item.to}
                label={item.label}
                active={matchRoute({ to: item.to }) !== false}
                bdrs="md"
              />
            ))}
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
