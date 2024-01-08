FROM node:20-alpine as base

# Install pnpm
RUN npm install pnpm -g

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json .
COPY ../.npmrc .

# Install dependencies
RUN pnpm install

# Copy the rest of the application files
COPY . .

EXPOSE 8080

# Set the entry point for the container
CMD ["pnpm", "run", "start"]
