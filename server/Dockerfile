FROM node:20-alpine as base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json .
COPY tsconfig.json .

# Install dependencies
RUN npm install

RUN npm run build

# Copy the rest of the application files
COPY ./dist .

EXPOSE 8080

# Set the entry point for the container
CMD ["node", "server.js"]
