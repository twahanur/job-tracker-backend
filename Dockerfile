# Stage 1: Build NestJS Application
FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency definitions
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies including dev dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile
RUN pnpm prisma generate

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/main.js"]
