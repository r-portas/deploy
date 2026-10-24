FROM oven/bun:1-alpine AS base
WORKDIR /usr/src/app

# copy manifests first so the install layer is cached until dependencies change
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

ENV NODE_ENV=production
RUN bun --bun vite build

# the Nitro bun preset bundles its own dependencies into .output,
# so the release image needs no node_modules
FROM base AS release
ENV NODE_ENV=production PORT=3000
COPY --from=build /usr/src/app/.output .output

# run the app
USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", ".output/server/index.mjs" ]
