import { createRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangleIcon, SearchXIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { routeTree } from "./routeTree.gen";

function DefaultNotFound() {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ButtonLink to="/" size="sm">
          Go home
        </ButtonLink>
      </EmptyContent>
    </Empty>
  );
}

function DefaultError({ error, reset }: ErrorComponentProps) {
  // In production, don't leak internal details
  const message = import.meta.env.DEV ? error.message : "An unexpected error occurred";

  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangleIcon />
        </EmptyMedia>
        <EmptyTitle>Something went wrong</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function getRouter() {
  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultNotFoundComponent: DefaultNotFound,
    defaultErrorComponent: DefaultError,
  });

  return router;
}
