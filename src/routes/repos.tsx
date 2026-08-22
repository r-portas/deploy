import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Code,
  CloseButton,
  Group,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { addRepoFn, deleteRepoFn, listReposFn } from "@/lib/repos";

const addRepoSchema = z.object({
  repoUrl: z.url({ message: "Enter a valid repo URL" }),
});

export const Route = createFileRoute("/repos")({
  component: RouteComponent,
  loader: async () => ({
    listRepos: await listReposFn(),
  }),
});

function RouteComponent() {
  const { listRepos } = Route.useLoaderData();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingRepo, setDeletingRepo] = useState<string>();

  const form = useForm({
    mode: "uncontrolled",
    initialValues: { repoUrl: "" },
    validate: schemaResolver(addRepoSchema, { sync: true }),
  });

  async function handleDeleteRepo(repo: string) {
    setDeletingRepo(repo);
    try {
      await deleteRepoFn({ data: repo });
      await router.invalidate();
    } finally {
      setDeletingRepo(undefined);
    }
  }

  async function handleAddRepo({ repoUrl }: { repoUrl: string }) {
    setIsSubmitting(true);
    try {
      await addRepoFn({ data: repoUrl });
      form.reset();
      await router.invalidate();
    } catch {
      form.setFieldError("repoUrl", "Failed to clone repo. Check the URL and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Title order={2} mb="sm">
        Repos
      </Title>

      <Card withBorder radius="md" padding="lg">
        <Card.Section withBorder px="sm" py="sm">
          <form onSubmit={form.onSubmit(handleAddRepo)}>
            <Group gap="xs" wrap="nowrap" align="flex-start">
              <TextInput
                placeholder="https://github.com/user/repo.git"
                key={form.key("repoUrl")}
                {...form.getInputProps("repoUrl")}
                disabled={isSubmitting}
                flex={1}
              />
              <Button type="submit" loading={isSubmitting} leftSection={<PlusIcon />}>
                Clone
              </Button>
            </Group>
          </form>
        </Card.Section>

        <Card.Section withBorder>
          {listRepos.length === 0 ? (
            <Text size="sm" c="dimmed" p="md">
              No repos yet. Clone one above.
            </Text>
          ) : (
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Repo</Table.Th>
                  <Table.Th>Remote</Table.Th>
                  <Table.Th>SHA</Table.Th>
                  <Table.Th w={40} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {listRepos.map((repo) => (
                  <Table.Tr key={repo.name}>
                    <Table.Td>
                      <Group gap={8} wrap="nowrap">
                        <Box w={7} h={7} bg="teal.6" style={{ borderRadius: 999, flexShrink: 0 }} />
                        <Text ff="monospace" fw={600} size="sm">
                          {repo.name}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td maw={220}>
                      {repo.remoteUrl && (
                        <Anchor
                          href={repo.remoteUrl}
                          target="_blank"
                          rel="noreferrer"
                          ff="monospace"
                          size="sm"
                          c="dimmed"
                          truncate
                          display="block"
                        >
                          {repo.remoteUrl}
                        </Anchor>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {repo.sha && (
                        <Badge variant="light" color="gray" radius="sm" tt="none" ff="monospace">
                          {repo.sha}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Delete repo">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDeleteRepo(repo.name)}
                          loading={deletingRepo === repo.name}
                        >
                          <TrashIcon weight="bold" />
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
