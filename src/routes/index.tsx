import { Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import SystemSummary from "@/components/home/system-summary";
import { dockerSystemInfoFn } from "@/lib/docker";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => ({
    dockerSystemInfo: await dockerSystemInfoFn(),
  }),
});

function RouteComponent() {
  const { dockerSystemInfo } = Route.useLoaderData();
  return (
    <>
      <Title order={2} mb="sm">
        Home
      </Title>
      <SystemSummary info={dockerSystemInfo} />
    </>
  );
}
