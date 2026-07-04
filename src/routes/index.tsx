import { Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import RepoListCard from "@/components/home/repo-list-card";
import SystemSummary from "@/components/home/system-summary";
import { dockerSystemInfoFn } from "@/lib/docker";
import { listReposFn } from "@/lib/repos";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => ({
    dockerSystemInfo: await dockerSystemInfoFn(),
    listRepos: await listReposFn(),
  }),
});

function RouteComponent() {
  const { dockerSystemInfo, listRepos } = Route.useLoaderData();
  return (
    <>
      <Title order={2} mb="sm">
        Home
      </Title>
      <SystemSummary info={dockerSystemInfo} />
      <RepoListCard repos={listRepos} />
    </>
  );
}
