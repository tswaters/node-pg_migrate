'use strict'

const { Client } = require('pg')
const logger = require('./logger')

let _config = null

exports.create_client = () => new Client(_config)

exports.configure = config => (_config = config)

const query = ({ client, dry_run, log }, query, values = []) => {
  const level = dry_run ? 'info' : 'debug'
  if (log !== false || level === 'debug') logger[level](query)
  if (dry_run === false) return client.query(query, values)
}

exports.query = query

exports.upsert_install = async (client, { schema, tablename }) => {
  const {
    rows: [{ exists }],
  } = await query(
    { client, dry_run: false, log: false },
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = $2)`,
    [tablename, schema]
  )

  if (exists === true) {
    return
  }

  await query(
    { client, dry_run: false, log: false },
    `
CREATE SCHEMA ${schema};
CREATE TABLE ${schema}.${tablename} (
  migration_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date_migrated TIMESTAMPTZ NOT NULL
);
CREATE INDEX migrations_date_migrated_idx ON ${schema}.${tablename} (date_migrated DESC);
  `
  )

  return exists
}

exports.drop_schema = async (client, { dry_run, schema }) => {
  return query(
    { client, dry_run, log: false },
    `DROP SCHEMA IF EXISTS ${schema} CASCADE;`
  )
}

exports.add_migration = (
  client,
  { dry_run, schema, tablename },
  { migration_id, name }
) => {
  return query(
    { client, log: false, dry_run },
    `
INSERT INTO ${schema}.${tablename} (migration_id, name, date_migrated)
VALUES ($1, $2, NOW());`,
    [migration_id, name]
  )
}

exports.get_migration = async (
  client,
  { schema, tablename },
  { migration_id }
) => {
  const {
    rows: [migration],
  } = await query(
    { client, dry_run: false, log: false },
    `
SELECT migration_id, name
FROM ${schema}.${tablename}
WHERE migration_id = $1;`,
    [migration_id]
  )
  return migration
}

exports.rollback_migration = async (client, { schema, tablename, step }) => {
  const { rows: migrations } = await query(
    { client, dry_run: false, log: false },
    `
DELETE FROM ${schema}.${tablename}
WHERE migration_id IN (
  SELECT migration_id
  FROM ${schema}.${tablename}
  ORDER BY date_migrated DESC
  LIMIT $1
)
RETURNING migration_id, name, date_migrated;`,
    [step]
  )
  return migrations
}

exports.get_migrations = async (client, { schema, tablename }) => {
  let migrations = null
  try {
    const { rows } = await query(
      { client, dry_run: false, log: false },
      `
SELECT migration_id, name, date_migrated
FROM ${schema}.${tablename};`
    )
    migrations = rows
  } catch (err) {
    if (err.code !== '42P01') throw err
    migrations = []
  }
  return migrations
}
