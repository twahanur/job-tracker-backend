FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma and ca-certificates
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm@11.16.0

# Copy package specifications
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Set database URL for Prisma client generation
ENV DATABASE_URL="postgresql://neondb_owner:npg_MHut8IFrl6Vq@ep-still-flower-ao4zszco-pooler.c-2.ap-southeast-1.aws.neon.tech/job-tracker?sslmode=require"

# Install production dependencies
RUN pnpm install --prod --no-frozen-lockfile

# Generate Prisma Client
RUN npx prisma generate

# Copy pre-compiled JavaScript application
COPY dist ./dist

# Ensure uploads directory exists
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/main.js"]
