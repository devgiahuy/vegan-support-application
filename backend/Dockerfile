FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=1000 --fetch-retry-maxtimeout=10000

COPY prisma ./prisma
COPY tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
RUN sed -i 's/\r$//' ./scripts/docker-entrypoint.sh && chmod +x ./scripts/docker-entrypoint.sh
COPY --from=build /app/src/database/legacy-policy.json ./src/database/legacy-policy.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-seed ./dist-seed

EXPOSE 4000

CMD ["sh", "scripts/docker-entrypoint.sh"]
