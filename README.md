# tss

TanStack Start app with shadcn/ui, oxlint, and oxfmt pre-configured.

## Quick Start

```sh
# Create a .env file (optional, PORT defaults to 3000)
echo "PORT=80" > .env

# Build and start the app in the background, available on http://localhost:3000
docker compose up -d
```

Set `PORT` in `.env` to change the port the app is published on.

## Dev Quick Start

```sh
# Install dependencies
bun install

# Start the dev server, available on http://localhost:3000
bun dev

# Format code with oxfmt
bun fmt

# Interactively update dependencies to their latest versions
bun run update
```

## Tech Stack

- TanStack Router + Start
- Tailwind CSS and shadcn/ui components
- Bun as package manager
- oxlint for linting
- oxfmt for formatting
