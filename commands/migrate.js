'use strict'

const { promisify } = require('util')
const path = require('path')
const { readdir: _readdir, readFile: _readFile } = require('fs')
const logger = require('../lib/logger')
const { connecting, migrations } = require('../lib/options')
const {
  create_client,
  upsert_install,
  get_migration,
  add_migration,
  query,
} = require('../lib/db')

const readdir = promisify(_readdir)
const readFile = promisify(_readFile)

exports.command = 'migrate'
exports.describe = 'migrate any changes to the target db'

exports.builder = yargs => {
  migrations(yargs)
  connecting(yargs)
}

exports.handler = async argv => {
  const { dry_run, run_tests } = argv
  const client = create_client()
  await client.connect()

  try {
    await query({ client, dry_run: false }, 'BEGIN;')
    await upsert_install(client, argv)

    const migration_path = path.join(process.cwd(), 'db', 'migrations')
    const test_path = path.join(process.cwd(), 'db', 'tests')
    const files = await readdir(migration_path)

    const migrations = await Promise.all(
      files.map(async file => {
        const [migrate, test] = await Promise.all([
          readFile(path.join(migration_path, file), 'utf-8'),
          readFile(path.join(test_path, file), 'utf-8'),
        ])
        const [migration_id, ...rest] = file.split('_')
        return {
          migration_id,
          name: rest.join('').replace(/.sql$/, ''),
          migrate,
          test,
        }
      })
    )

    for (const { migration_id, name, migrate, test } of migrations) {
      if (!(await get_migration(client, argv, { migration_id }))) {
        if (dry_run === false)
          logger.info(`Migrating ${migration_id} - ${name}`)
        await query({ client, dry_run }, migrate)

        if (run_tests === true) {
          try {
            await query({ client, dry_run }, test)
          } catch (err) {
            logger.error(`Tests failed for ${migration_id} - ${name}`)
            throw err
          }
        }

        await add_migration(client, argv, { migration_id, name })
      }
    }

    await query({ client, dry_run: false, log: true }, 'COMMIT;')
  } catch (err) {
    await query({ client, dry_run: false, log: true }, 'ROLLBACK;')
    throw err
  } finally {
    await client.end()
  }
}
