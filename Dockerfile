FROM node:20-alpine3.19 AS base
WORKDIR /usr/src/app

FROM base AS build

COPY package.json ./
COPY package.json bun.lockb ./
RUN yarn install --no-lockfile
COPY . .
RUN yarn run build

FROM oven/bun:latest AS production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json .
COPY --from=build /usr/src/app/bun.lockb .

ENTRYPOINT [ "bun", "run", "dist/src/main.js" ]
