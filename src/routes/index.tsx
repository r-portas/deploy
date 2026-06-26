import { Text, Title } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Title order={2} mb="sm">
        Home
      </Title>
      <Text c="dimmed">Welcome to your app.</Text>
    </>
  );
}
