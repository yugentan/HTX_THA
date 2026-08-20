# ---- Build stage ----
# Use an official Node.js LTS (Long Term Support) as a parent image
FROM node:lts-slim AS build

# Set the working directory
WORKDIR /app

# Install all dependencies (dev deps needed for typescript + rimraf)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the source
COPY . .

# Reset the dist folder, then build it
RUN npm run clean
RUN npm run build


# ---- Runtime stage ----
# Use an official Node.js LTS (Long Term Support) as a parent image
FROM node:lts-slim

# Set the working directory
WORKDIR /app

# Install production dependencies only (express, cors, dotenv)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the build files from the build stage
COPY --from=build /app/dist /app/dist

# Runtime config (override with docker run -e)
ENV NODE_ENV=production
ENV PORT=9000
ENV CORS_ORIGIN=http://localhost:8080

# Expose the port
EXPOSE 9000

# cmd to run the api
CMD ["node", "dist/server.js"]
