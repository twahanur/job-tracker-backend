FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma engine
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@11.16.0

# Copy package manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Database URL for Prisma schema validation
ENV DATABASE_URL="postgresql://neondb_owner:npg_MHut8IFrl6Vq@ep-still-flower-ao4zszco-pooler.c-2.ap-southeast-1.aws.neon.tech/job-tracker?sslmode=require"

# Install dependencies non-interactively
RUN pnpm install --no-frozen-lockfile

# Generate Prisma Client directly from local node_modules binary
RUN ./node_modules/.bin/prisma generate

# Copy pre-compiled JavaScript
COPY dist ./dist

# Create uploads directory
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/main.js"]
