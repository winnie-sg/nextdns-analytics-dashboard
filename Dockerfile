FROM oven/bun:1 AS base
WORKDIR /app

# Disable Next.js anonymous telemetry for installs/builds in all stages derived from base.
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/lib/db ./src/lib/db
COPY --from=builder /app/src/instrumentation.ts ./src/instrumentation.ts

RUN mkdir -p .next/cache /app/data && chown -R nextjs:nodejs .next /app/data

USER nextjs

EXPOSE 3000

CMD ["bun", "server.js"]
