FROM node:22-slim

WORKDIR /app

# Install OpenSSL for Prisma and essentials
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS
RUN pnpm build

# Ensure uploads directory
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "dist/main.js"]
