# Build stage: full install (tsc and tsup are devDependencies), compile to dist/, then drop the devDependencies
FROM node:24-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# --omit=optional too: @prisma/client lists prisma and typescript as optional peers, which --omit=dev alone keeps
RUN npm run build && npm prune --omit=dev --omit=optional

# Runtime stage: production dependencies and dist/ only
FROM node:24-alpine AS runner
WORKDIR /app
# production also keeps the logger off pino-pretty, a devDependency (src/app.ts)
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
USER node
EXPOSE 3000
# Liveness only: GET /api/health doesn't touch the database. busybox wget (alpine has no curl); 127.0.0.1 because
# localhost can resolve to ::1 while the server listens on IPv4; PORT is read at run time (default 3000, src/config/env.ts)
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
CMD ["node", "dist/server.js"]
