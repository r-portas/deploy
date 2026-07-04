import {
  ActionIcon,
  Box,
  Card,
  CloseButton,
  Code,
  Group,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { schemaResolver, useForm } from "@mantine/form";
import { FolderIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { addRepoFn, deleteRepoFn } from "@/lib/repos";

const addRepoSchema = z.object({
  repoUrl: z.url({ message: "Enter a valid repo URL" }),
});

interface RepoListCardProps {
  /** Directory names of repos already cloned into the apps dir. */
  repos: string[];
}

/**
 * Shows the list of cloned repos with a form at the bottom to clone a new one.
 */
export default function RepoListCard({ repos }: RepoListCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [output, setOutput] = useState<string>();
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
      const result = await addRepoFn({ data: repoUrl });
      setOutput(result);
      form.reset();
      await router.invalidate();
    } catch {
      form.setFieldError("repoUrl", "Failed to clone repo. Check the URL and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card withBorder padding="lg" radius="md" h="100%">
      <Card.Section withBorder inheritPadding py="sm">
        <Title order={4}>Repos</Title>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="sm">
        <ScrollArea.Autosize mah={280}>
          {repos.length === 0 ? (
            <Text size="sm" c="dimmed">
              No repos yet. Add one below.
            </Text>
          ) : (
            <Stack gap={4}>
              {repos.map((repo) => (
                <Group key={repo} gap="xs" wrap="nowrap" justify="space-between">
                  <Group gap="xs" wrap="nowrap">
                    <FolderIcon weight="bold" />
                    <Text size="sm">{repo}</Text>
                  </Group>
                  <Tooltip label="Delete repo">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteRepo(repo)}
                      loading={deletingRepo === repo}
                    >
                      <TrashIcon weight="bold" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ))}
            </Stack>
          )}
        </ScrollArea.Autosize>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="sm">
        <Title order={6} mb="xs">
          Add repo
        </Title>

        <form onSubmit={form.onSubmit(handleAddRepo)}>
          <Group gap="xs" align="flex-start" wrap="nowrap">
            <TextInput
              placeholder="https://github.com/user/repo.git"
              key={form.key("repoUrl")}
              {...form.getInputProps("repoUrl")}
              disabled={isSubmitting}
              flex={1}
            />
            <ActionIcon type="submit" variant="filled" size="lg" loading={isSubmitting}>
              <PlusIcon weight="bold" />
            </ActionIcon>
          </Group>
        </form>

        {output && (
          <Box pos="relative" mt="sm">
            <Code block bg="dark.8">
              {output}
            </Code>
            <CloseButton
              size="sm"
              pos="absolute"
              top={4}
              right={4}
              onClick={() => setOutput(undefined)}
            />
          </Box>
        )}
      </Card.Section>
    </Card>
  );
}
