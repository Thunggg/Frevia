FROM node:22-alpine AS builder
RUN corepack enable
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter api exec prisma generate
RUN pnpm run build --filter=api
RUN pnpm run build --filter @shared/types

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared-type/dist ./packages/shared-type/dist
COPY --from=builder /app/packages/shared-type/package.json ./packages/shared-type/package.json
EXPOSE 3000
CMD ["node", "apps/api/dist/src/main.js"]