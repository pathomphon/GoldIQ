FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/mock-hsh/package.json apps/mock-hsh/package.json
RUN npm ci

FROM dependencies AS build
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN npm run prisma:generate --workspace @goldiq/api
RUN npm run build --workspace @goldiq/api

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma
USER nestjs
EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
