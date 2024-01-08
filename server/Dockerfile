FROM node:20-alpine as base

# Set the working directory
WORKDIR /app



# Copy package.json and package-lock.json
COPY package.json .
COPY tsconfig.json .
COPY types.d.ts .

# Install dependencies
RUN npm install

COPY ./src ./src

RUN npm run build

FROM base as build


# Copy the rest of the application files
COPY ./dist .

EXPOSE 8080

# Set the entry point for the container
CMD ["node", "index.js"]
