FROM node:20-alpine as base

FROM base as build

WORKDIR /tmp

COPY package.json .
COPY tsconfig.json .
COPY vite.config.ts .
COPY types.d.ts .
COPY ./src .

# Install dependencies
RUN npm install
RUN npm run build

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

EXPOSE 8080

HEALTHCHECK --interval=1m --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health/status || exit 1

# Set the entry point for the container
CMD ["node", "index.mjs"]
