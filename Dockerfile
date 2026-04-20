# Multi-stage build for NestJS backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli*.json ./backend/

# Install dependencies at workspace level
RUN npm ci

# Copy prisma schema
COPY backend/prisma ./backend/prisma/

# Copy source code
COPY backend/src ./backend/src/

# Build
WORKDIR /app/backend
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY backend/package*.json ./backend/

WORKDIR /app/backend
EXPOSE 3000

CMD ["npm", "run", "start:prod"]
