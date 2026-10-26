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
CMD ["node", "dist/server.js"]
