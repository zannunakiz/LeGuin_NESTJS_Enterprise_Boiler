FROM node:20-alpine AS base

RUN npm install -g pnpm@9.12.2

# BUILD FOR LOCAL DEVELOPMENT
FROM base AS development
WORKDIR /app
RUN chown -R node:node /app

COPY --chown=node:node package*.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies)
RUN pnpm fetch --frozen-lockfile
RUN pnpm install --frozen-lockfile

# Bundle app source
COPY --chown=node:node . .

# Use the node user from the image (instead of the root user)
USER node

# BUILD BUILDER IMAGE
FROM base AS builder
WORKDIR /app

COPY --chown=node:node package*.json pnpm-lock.yaml ./
COPY --chown=node:node --from=development /app/node_modules ./node_modules
COPY --chown=node:node --from=development /app/src ./src
COPY --chown=node:node --from=development /app/tsconfig.json ./tsconfig.json
COPY --chown=node:node --from=development /app/tsconfig.build.json ./tsconfig.build.json
COPY --chown=node:node --from=development /app/nest-cli.json ./nest-cli.json

# Build server
RUN pnpm build

# Run migrations & seeds
RUN pnpm migration:up
RUN pnpm seed:run

# Removes unnecessary packages and re-install only production dependencies
ENV NODE_ENV production
RUN pnpm prune --prod
RUN pnpm fetch --frozen-lockfile
RUN pnpm install --frozen-lockfile --prod

USER node

# BUILD FOR PRODUCTION
FROM node:20-alpine AS production
WORKDIR /app

RUN npm install -g pm2

RUN chown -R node:node /app

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=builder /app/src/generated/* ./src/generated/
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=development /app/pm2.config.json ./

USER node

CMD ["pm2-runtime", "start", "pm2.config.json"]
