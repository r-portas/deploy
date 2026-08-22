import { Card, Code, ScrollArea, Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { getAppFn, getAppLogsFn } from "@/lib/apps";

export const Route = createFileRoute("/apps/$appName")({
  component: RouteComponent,
  loader: async ({ params }) => {
    const app = await getAppFn({ data: params.appName });
    return {
      app,
      logs: await getAppLogsFn({ data: app.configFiles.split(",")[0] }),
    };
  },
});

function RouteComponent() {
  const { app, logs } = Route.useLoaderData();

  return (
    <>
      <Title order={2} mb="sm">
        {app.name}
      </Title>

      <Card withBorder radius="md" padding="lg">
        <Card.Section withBorder px="sm" py="sm">
          <Text fw={600} size="sm">
            Logs
          </Text>
        </Card.Section>

        <Card.Section>
          {logs ? (
            <ScrollArea.Autosize mah={480} type="auto">
              <Code block>{logs}</Code>
            </ScrollArea.Autosize>
          ) : (
            <Text size="sm" c="dimmed" p="md">
              No logs available.
            </Text>
          )}
        </Card.Section>
      </Card>
    </>
  );
}
