FROM node:alpine

COPY --from=pg_migrate:latest /app /node-lib/pg_migrate
RUN npm i -g /node-lib/pg_migrate

WORKDIR /app

ADD --chown=node:node package.json package-lock.json ./
RUN npm i

ADD --chown=node:node . .
CMD ["/app/docker-entrypoint.sh"]
