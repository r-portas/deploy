# Deploy

A small self-hosted dashboard for a single Docker host. It reads the local Docker daemon and shows a
summary of the host plus a launcher for your services, grouped by category.

## Features

- **System summary**: container counts by state (running, paused, stopped) and key host details.
- **Service dashboard**: links to your services, grouped by category, with their current state.
  Services opt in with `homepage.*` container labels, the same ones
  [gethomepage.dev](https://gethomepage.dev) uses.
- **Compose stacks**: containers are grouped into stacks using the labels Compose puts on them.
  Stacks are available through the `getStacksFn` server function, but are not shown in the UI yet.

## Quick Start

Requires Docker with Compose.

```sh
# Create a .env file (optional, PORT defaults to 3000)
echo "PORT=80" > .env

# Build and start the app in the background, available on http://localhost:3000
docker compose up -d
```

Set `PORT` in `.env` to change the port the app is published on.

## Adding services to the dashboard

Add labels to any container. `homepage.name` and `homepage.href` are required, and containers
missing either, or with a non-http(s) `href`, are skipped.

```yaml
services:
  wiki:
    image: example/wiki
    labels:
      homepage.name: Wiki
      homepage.href: http://localhost:8080
      homepage.group: Tools # optional, defaults to "Other"
      homepage.description: Team notes # optional
```

`homepage.href` may start with `{{HOMEPAGE_VAR_URL}}`, which the browser replaces with the protocol
and hostname (no port) it opened the dashboard from. This is useful for services published on
another port of the same host:

```yaml
homepage.href: "{{HOMEPAGE_VAR_URL}}:61208"
```

## Dev Quick Start

```sh
# Install dependencies
bun install

# Start the dev server, available on http://localhost:3000
bun dev

# Run the tests
bun test

# Format code with oxfmt
bun fmt

# Interactively update dependencies to their latest versions
bun run update
```

The dev server also needs access to `/var/run/docker.sock`.

## Project Structure

- `src/routes` holds the TanStack Router file routes.
- `src/components` holds app components, with shadcn/ui primitives in `src/components/ui`.
- `src/lib` holds library code grouped by domain (`docker`, `dashboard`) using suffixes such as
  `.server.ts`, `.functions.ts`, `.schemas.ts` and `.types.ts`. See [AGENTS.md](./AGENTS.md) for the
  conventions.

## Tech Stack

- TanStack Router + Start, built with Vite and Nitro (Bun preset)
- TanStack Charts
- Tailwind CSS and shadcn/ui components
- Zod for validating Docker API responses
- Bun as package manager, runtime and test runner
- oxlint for linting
- oxfmt for formatting
