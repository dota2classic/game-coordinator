FROM node:20-alpine3.19 AS base
FROM  node:20-alpine3.19 AS base

FROM base AS build

WORKDIR /usr/src/app
COPY package.json ./
COPY package.json bun.lockb ./
RUN yarn install --no-lockfile
COPY . .
RUN yarn build
RUN yarn run build

FROM base AS production

FROM oven/bun:latest AS production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json .
COPY --from=build /usr/src/app/bun.lockb .

CMD ["sh", "-c", "yarn start:prod"]
ENTRYPOINT [ "bun", "run", "dist/main.js" ]

