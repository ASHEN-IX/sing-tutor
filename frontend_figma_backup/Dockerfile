# syntax=docker/dockerfile:1.7
FROM node:18-alpine

WORKDIR /app

# Copy package files (use package-lock.json if present to enable caching)
COPY package*.json ./

# Install dependencies. Cache the npm download store between builds.
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --progress=false

# Update Browserslist DB to avoid caniuse-lite errors at build/runtime
RUN npx browserslist@latest --update-db || true

# Copy app code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Run the app
CMD ["npm", "run", "dev"]
