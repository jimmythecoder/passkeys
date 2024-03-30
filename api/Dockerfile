FROM node:20-alpine as base

FROM base as build

RUN corepack enable 
RUN corepack prepare pnpm@latest --activate
RUN corepack use pnpm@8.x

WORKDIR /tmp

COPY package.json .
COPY tsconfig.json .
COPY vite.config.ts .
COPY types.d.ts .
COPY ./src .

# Install dependencies
RUN pnpm install
RUN pnpm run build:cjs

FROM base as final

RUN mkdir /app
RUN addgroup -S app && adduser -S -G app app
RUN chown -R app:app /app
USER app

WORKDIR /app

# Copy the rest of the application files
COPY ./dist .
COPY ./node_modules ./node_modules
COPY .env .

EXPOSE ${CONTAINER_PORT}

HEALTHCHECK --interval=1m --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:${CONTAINER_PORT}/api/health/status || exit 1

# Set the entry point for the container
CMD ["node", "index.mjs"]
