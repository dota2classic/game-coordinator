FROM node:20-alpine3.19 AS base

FROM base AS build

WORKDIR /usr/src/app
COPY package.json ./
RUN yarn install --no-lockfile
COPY . .
RUN yarn build

FROM base AS production

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json .

CMD ["sh", "-c", "yarn start:prod"]
