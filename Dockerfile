FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Copy package specifications
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Set build-time database URL for Prisma schema validation
ENV DATABASE_URL="postgresql://neondb_owner:npg_MHut8IFrl6Vq@ep-still-flower-ao4zszco-pooler.c-2.ap-southeast-1.aws.neon.tech/job-tracker?sslmode=require"

# Install all dependencies
RUN pnpm install

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
