FROM node:alpine

WORKDIR /app

COPY --chown=node:node . .
RUN npm install --only=production

ENTRYPOINT ["node", "./bin/pg_migrate"]
