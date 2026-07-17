FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/mock-hsh/package.json apps/mock-hsh/package.json
RUN npm ci

FROM dependencies AS build
COPY tsconfig.base.json ./
COPY apps/mock-hsh apps/mock-hsh
RUN npm run build --workspace @goldiq/mock-hsh

FROM node:22-alpine AS runtime
ENV NODE_ENV=development
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 mock
COPY --from=build --chown=mock:nodejs /app/apps/mock-hsh/dist ./dist
USER mock
EXPOSE 4010
CMD ["node", "dist/main.js"]

