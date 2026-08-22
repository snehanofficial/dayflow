FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package and lock files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy tsconfig and vite configuration
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./

# Copy source and public files
COPY src ./src
COPY public ./public

# Build the application
RUN pnpm run build

FROM nginx:stable-alpine AS runner

# Copy custom Nginx configuration for React router SPA support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
