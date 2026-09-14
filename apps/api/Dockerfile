# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
RUN npm install

COPY apps/api ./
RUN npx prisma generate
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 4000
USER node

CMD ["node", "dist/main.js"]
