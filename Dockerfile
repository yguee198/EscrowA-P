# Multi-stage build for NestJS backend
FROM node:18-bookworm AS builder

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/nest-cli.json ./backend/

# Install dependencies at workspace level
RUN npm ci

# Copy prisma schema
COPY backend/prisma ./backend/prisma/

# Copy source code
COPY backend/src ./backend/src/

# Generate Prisma client first
WORKDIR /app/backend
RUN npx prisma generate

# Build
RUN npm run build

# Production stage
FROM node:18-bookworm

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/nest-cli.json ./backend/

WORKDIR /app/backend

# Run Prisma migrations and generate client
RUN npx prisma migrate deploy
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
