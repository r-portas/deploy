import { DonutChart } from "@mantine/charts";
import { Box, Card, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { CpuIcon, LinuxLogoIcon, PackageIcon, ShippingContainerIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

import RepoListCard from "@/components/home/repo-list-card";
import { dockerSystemInfoFn } from "@/lib/docker";
import { listReposFn } from "@/lib/repos";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => ({
    dockerSystemInfo: await dockerSystemInfoFn(),
    listRepos: await listReposFn(),
  }),
});

// #region SystemSummary

interface SystemSummaryProps {
  /** Docker system info returned by the loader. */
  info: ReturnType<typeof Route.useLoaderData>["dockerSystemInfo"];
}

interface StatCardProps {
  icon: ReactNode;
  color: string;
  label: string;
  value: ReactNode;
  /** Capitalizes the first letter of the value, e.g. for raw OS names like "linux". */
  capitalize?: boolean;
}

function StatCard({ icon, color, label, value, capitalize }: StatCardProps) {
  return (
    <Card withBorder padding="lg" radius="md" pos="relative" style={{ overflow: "hidden" }}>
      <Box pos="absolute" top={0} left={0} right={0} h={3} bg={`${color}.6`} />
      <Group gap="sm" mb="md">
        <ThemeIcon variant="light" color={color} size="lg" radius="md">
          {icon}
        </ThemeIcon>
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: 0.4 }}>
          {label}
        </Text>
      </Group>
      <Text fw={700} fz="2rem" lh={1} tt={capitalize ? "capitalize" : undefined}>
        {value}
      </Text>
    </Card>
  );
}

const CONTAINER_LEGEND: {
  key: "containersRunning" | "containersPaused" | "containersStopped";
  label: string;
  color: string;
}[] = [
  { key: "containersRunning", label: "Running", color: "teal" },
  { key: "containersPaused", label: "Paused", color: "yellow" },
  { key: "containersStopped", label: "Stopped", color: "red" },
];

function SystemSummary({ info }: SystemSummaryProps) {
  const containerData = CONTAINER_LEGEND.map((entry) => ({
    name: entry.label,
    value: info[entry.key],
    color: `${entry.color}.6`,
  })).filter((d) => d.value > 0);

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="xl">
      <Card withBorder padding="lg" radius="md" pos="relative" style={{ overflow: "hidden" }}>
        <Box pos="absolute" top={0} left={0} right={0} h={3} bg="teal.6" />
        <Group gap="sm" mb="md">
          <ThemeIcon variant="light" color="teal" size="lg" radius="md">
            <ShippingContainerIcon weight="bold" />
          </ThemeIcon>
          <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: 0.4 }}>
            Containers
          </Text>
        </Group>
        <Group gap="lg" wrap="nowrap" align="center">
          <Box w={100} miw={100}>
            <DonutChart
              data={containerData}
              chartLabel={String(info.containers)}
              size={100}
              thickness={14}
            />
          </Box>
          <Stack gap={6} flex={1}>
            {CONTAINER_LEGEND.map((entry) => (
              <Group key={entry.key} justify="space-between" gap="xs" wrap="nowrap">
                <Group gap={6} wrap="nowrap">
                  <Box
                    w={8}
                    h={8}
                    bg={`${entry.color}.6`}
                    style={{ borderRadius: 999, flexShrink: 0 }}
                  />
                  <Text size="sm" c="dimmed">
                    {entry.label}
                  </Text>
                </Group>
                <Text size="sm" fw={600}>
                  {info[entry.key]}
                </Text>
              </Group>
            ))}
          </Stack>
        </Group>
      </Card>

      <StatCard
        icon={<PackageIcon weight="bold" />}
        color="yellow"
        label="Images"
        value={info.images}
      />

      <StatCard
        icon={<LinuxLogoIcon weight="bold" />}
        color="grape"
        label="OS Type"
        value={info.osType}
        capitalize
      />

      <StatCard
        icon={<CpuIcon weight="bold" />}
        color="blue"
        label="Architecture"
        value={info.architecture}
      />
    </SimpleGrid>
  );
}

// #endregion

function RouteComponent() {
  const { dockerSystemInfo, listRepos } = Route.useLoaderData();
  return (
    <>
      <Title order={2} mb="sm">
        Home
      </Title>
      <SystemSummary info={dockerSystemInfo} />
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <RepoListCard repos={listRepos} />
      </SimpleGrid>
    </>
  );
}
