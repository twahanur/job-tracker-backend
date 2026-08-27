FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma and ca-certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Enable corepack pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Build-time environment variable for Prisma
ENV DATABASE_URL="postgresql://neondb_owner:npg_MHut8IFrl6Vq@ep-still-flower-ao4zszco-pooler.c-2.ap-southeast-1.aws.neon.tech/job-tracker?sslmode=require"

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client & Build
RUN pnpm prisma generate
RUN pnpm build

# Ensure uploads directory exists
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/main.js"]
