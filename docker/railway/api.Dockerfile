FROM node:24-bookworm-slim AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY api ./api
COPY libs ./libs

RUN pnpm install --frozen-lockfile
RUN pnpm nx build api

FROM node:24-bookworm-slim AS runtime

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/pnpm-lock.yaml ./
COPY --from=build /app/pnpm-workspace.yaml ./
COPY --from=build /app/nx.json ./
COPY --from=build /app/tsconfig.base.json ./
COPY --from=build /app/api ./api
COPY --from=build /app/libs ./libs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

CMD ["sh", "-lc", "pnpm migration:run && node dist/api/main.js"]
