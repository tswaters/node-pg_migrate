# pg_migrate

This is vaporware. I wouldn't recommend using it.

## usage

```
Migration utility for postgres

Commands:
  pg_migrate init               write initial config to current directory
  pg_migrate new <name>         create a new migration
  pg_migrate migrate            migrate any changes to the target db
  pg_migrate rollback [step=1]  Rollback a specific migration
  pg_migrate test               test database connection
  pg_migrate status             show current status of migrations
  pg_migrate drop               rolls back all migrations and drops the tracking
                                schema

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --config   JSON file accepting configuration          [default: ".migratorrc"]
```

## usage with docker

For this to work, you need to mount the `db` directory as a volume. This looks different in windows vs. linux

```
# linux
docker run --network host -v `pwd`/db:/app/db --env-file .env pg_migrate:latest rollback

rem windows
docker run --network host -v %cd%/db:/app/db --env-file .env pg_migrate:latest rollback
```

If running locally, you'll probably want to give it `--network host` as well so it can talk to localhost.

If might also make sense to make your own customizations, inherit from this `Dockerfile` and add whatever you need

```
FROM pg_migrate:latest
WORKDIR /app
ADD db /app/db
ADD entry.sh /app/db/entry.sh
ADD wait-for-it.sh /app/db/wait-for-it.sh
ENTRYPOINT ["/app/db/entry.sh"]
```

```
#!/bin/bash
set -e

./wait-for-it.sh "$PGHOST:$PGPORT"

PGPASSWORD_FILE=/var/run/secrets/PGPASSWORD

if [ -f $PGPASSWORD_FILE ]; then
  export PGPASSWORD=`cat ${PGPASSWORD_FILE}`
fi

/app/bin/pg_migrate "$@"
```

## example

```
$ pg_migrate test
FATAL: password authentication failed for user "root"

$ PGDATABSE=postgres PGUSER=postgres pg_migrate test
Connecting to postgres://postgres@localhost/postgres
Success!

$ pg_migrate init
Creating directory: ./db
Creating directory: ./db/migrations
Creating directory: ./db/rollbacks

$ pg_migrate new my-new-migration

Creating file: db/migrations/1556489937309_my-new-migration.sql
Creating file: db/rollbacks/1556489937309_my-new-migration.sql
Creating file: db/tests/1556489937309_my-new-migration.sql

$ pg_migrate migrate

Migrating 1556489937309 - my-new-migration

$ pg_migrate status

┌───────────────────┬──────────────────────┬──────────────────────────────┐
│    migration_id   │         name         │         date_migrated        │
├───────────────────┼──────────────────────┼──────────────────────────────┤
│   1556489937309   │   my-new-migration   │   2019-04-28T22:21:04.155Z   │
└───────────────────┴──────────────────────┴──────────────────────────────┘

$ pg_migrate rollback my-new-migration

Rolling back 1556489937309 - my-new-migration
```
