# ---- Build ----
FROM node:lts-slim AS build

# Set the working directory
WORKDIR /app

# Install all dependencies (dev deps needed for webpack + rimraf)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source and env file
COPY . .

# API_BASE_URL comes from compose as a build arg;
# falls back to .env.production when built with plain docker build
ARG API_BASE_URL
ENV API_BASE_URL=$API_BASE_URL

# Reset the dist folder, then build it
RUN npm run clean
RUN npm run build


# ---- Runtime ----
FROM node:lts-slim

# Set the working directory
WORKDIR /app

# Install http-server globally
RUN npm install -g http-server

# Copy the build files from the build stage
COPY --from=build /app/dist /app/dist

# Expose the port
EXPOSE 8080

# cmd to run react app
CMD ["http-server", "dist", "--port=8080"]
