import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cloneRepoFn, listReposFn } from "@/lib/repos.functions";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: async () => ({
    repos: await listReposFn(),
  }),
});

function AddRepoForm() {
  const router = useRouter();
  const cloneRepo = useServerFn(cloneRepoFn);

  const [url, setUrl] = React.useState("");
  const [isCloning, setIsCloning] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    setIsCloning(true);
    try {
      await cloneRepo({ data: url });
      setUrl("");
      // Re-run the loader so the new repo shows up without a full reload.
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add repo");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="url"
          required
          placeholder="https://github.com/user/repo.git"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          disabled={isCloning}
        />
        <Button type="submit" disabled={isCloning}>
          {isCloning ? "Adding..." : "Add repo"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function RouteComponent() {
  const { repos } = Route.useLoaderData();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Repos</CardTitle>
        <CardDescription>Clone and manage the repos available for deployment.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AddRepoForm />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Path</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  No repos yet. Add one above to get started.
                </TableCell>
              </TableRow>
            ) : (
              repos.map((repo) => (
                <TableRow key={repo.path}>
                  <TableCell className="font-medium">{repo.name}</TableCell>
                  <TableCell className="text-muted-foreground">{repo.path}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
