# Multi-stage build for NestJS backend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli*.json ./backend/

# Install dependencies
WORKDIR /app/backend
RUN npm ci

# Copy prisma schema
COPY backend/prisma ./prisma/

# Copy source code
COPY backend/src ./src/

# Build
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY backend/package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
