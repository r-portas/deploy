import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Code,
  Group,
  Select,
  Table,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { PlayIcon, StopIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { listAvailableAppsFn, listRunningAppsFn, startAppFn, stopAppFn } from "@/lib/apps";

const startAppSchema = z.object({
  composeFilePath: z.string().min(1, { message: "Select an app to start" }),
});

export const Route = createFileRoute("/apps/")({
  component: RouteComponent,
  loader: async () => ({
    runningApps: await listRunningAppsFn(),
    availableApps: await listAvailableAppsFn(),
  }),
});

function RouteComponent() {
  const { runningApps, availableApps } = Route.useLoaderData();
  const router = useRouter();
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [startOutput, setStartOutput] = useState<string[]>();
  const [stoppingApp, setStoppingApp] = useState<string>();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { composeFilePath: "" },
    validate: schemaResolver(startAppSchema, { sync: true }),
  });

  async function handleStartApp({ composeFilePath }: { composeFilePath: string }) {
    setIsStarting(true);
    const output = await startAppFn({ data: composeFilePath });
    setStartOutput(output);
    form.reset();
    await router.invalidate();
    setIsStarting(false);
  }

  async function handleStopApp(configFiles: string) {
    setStoppingApp(configFiles);
    await stopAppFn({ data: configFiles });
    await router.invalidate();
    setStoppingApp(undefined);
  }

  return (
    <>
      <Title order={2} mb="sm">
        Apps
      </Title>

      <Card withBorder radius="md" padding="lg">
        <Card.Section withBorder px="sm" py="sm">
          <form onSubmit={form.onSubmit(handleStartApp)}>
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <Select
                placeholder="Select a compose file"
                data={availableApps}
                searchable
                key={form.key("composeFilePath")}
                {...form.getInputProps("composeFilePath")}
                disabled={isStarting}
                flex={1}
              />
              <Button type="submit" loading={isStarting} leftSection={<PlayIcon />}>
                Start
              </Button>
            </Group>
          </form>
          {startOutput && (
            <Code block mt="sm">
              {startOutput.join("\n")}
            </Code>
          )}
        </Card.Section>

        <Card.Section withBorder>
          {runningApps.length === 0 ? (
            <Text size="sm" c="dimmed" p="md">
              No apps running. Start one above.
            </Text>
          ) : (
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>App</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Config</Table.Th>
                  <Table.Th w={40} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {runningApps.map((app) => (
                  <Table.Tr
                    key={app.name}
                    onClick={() =>
                      navigate({ to: "/apps/$appName", params: { appName: app.name } })
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <Table.Td>
                      <Group gap={8} wrap="nowrap">
                        <Box
                          w={7}
                          h={7}
                          bg={app.status.startsWith("running") ? "teal.6" : "gray.5"}
                          style={{ borderRadius: 999, flexShrink: 0 }}
                        />
                        <Text ff="monospace" fw={600} size="sm">
                          {app.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        variant="light"
                        color={app.status.startsWith("running") ? "teal" : "gray"}
                        radius="sm"
                        tt="none"
                      >
                        {app.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td maw={320}>
                      <Text ff="monospace" size="sm" c="dimmed" truncate>
                        {app.configFiles}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Stop app">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleStopApp(app.configFiles);
                          }}
                          loading={stoppingApp === app.configFiles}
                        >
                          <StopIcon weight="bold" />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card.Section>
      </Card>
    </>
  );
}
