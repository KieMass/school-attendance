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

# Deliberately NOT running `prisma migrate deploy` here. Auto-migrating on
# every container boot means concurrent instances could race to apply
# migrations, and running the CLI inside this minimal runtime image proved
# unreliable in practice (its schema-engine binary is fetched lazily on
# first use, and doing that from inside a locked-down runtime container is
# fragile). Instead, apply migrations as a deliberate one-off step — from
# your own machine, or a CI job — before/after each deploy:
#   npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
# See docs/DEPLOYMENT.md.
CMD ["node", "dist/main.js"]
