FROM node:20-alpine as base

FROM base as build

WORKDIR /tmp

COPY package.json .
COPY tsconfig.json .
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


# Set the entry point for the container
CMD ["node", "index.js"]
