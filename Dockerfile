FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma, ca-certificates, and build-essentials for bcrypt
RUN apt-get update -y && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install exact pnpm version
RUN npm install -g pnpm@11.16.0

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Set build-time database URL for Prisma schema validation
ENV DATABASE_URL="postgresql://neondb_owner:npg_MHut8IFrl6Vq@ep-still-flower-ao4zszco-pooler.c-2.ap-southeast-1.aws.neon.tech/job-tracker?sslmode=require"

# Install all dependencies including build devDependencies
RUN pnpm install --prod=false

# Copy source code
COPY . .

# Generate Prisma Client & Build
RUN npx prisma generate
RUN npm run build

# Ensure uploads directory exists
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "dist/main.js"]
