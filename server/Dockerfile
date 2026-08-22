FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package and lock files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen-lockfile ensures exact matches from lockfile)
RUN pnpm install --frozen-lockfile

# Copy configuration and schema
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./

# Generate Prisma client
RUN pnpm prisma:generate

# Copy source code and build the application
COPY src ./src
RUN pnpm run build

# Prune dev dependencies
RUN pnpm prune --prod

FROM node:22-alpine AS runner

WORKDIR /app

# Copy production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
