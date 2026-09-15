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

EXPOSE 4000
USER node

# --chown so the non-root `node` user actually owns these files — without
# it everything is root-owned and `prisma migrate deploy` fails at startup
# trying to write/verify its engine binaries under node_modules/@prisma.
COPY --from=builder --chown=node:node /app/apps/api/package*.json ./
COPY --from=builder --chown=node:node /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./dist
COPY --from=builder --chown=node:node /app/apps/api/prisma ./prisma

# Applies any pending migrations before starting — makes the container
# self-contained for platforms (Render free tier, etc.) that don't give you
# a shell to run `prisma migrate deploy` by hand before first boot.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
