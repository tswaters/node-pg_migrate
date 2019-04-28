'use strict'

const { promisify } = require('util')
const path = require('path')
const { readFile: _readFile } = require('fs')
const logger = require('../lib/logger')
const { danger } = require('../lib/danger')
const { connecting, migrations } = require('../lib/options')
const {
  query,
  create_client,
  upsert_install,
  get_migrations,
  drop_schema,
} = require('../lib/db')

const readFile = promisify(_readFile)

exports.command = 'drop'
exports.describe = 'rolls back all migrations and drops the tracking schema'

exports.builder = yargs => {
  connecting(yargs)
  migrations(yargs)

  yargs.option('force', {
    alias: 'f',
    describe: 'force the issue',
  })

  yargs.middleware(async argv => {
    if (argv.force !== true) {
      const confirmed = await danger('Are you sure you want to drop this?!')
      if (!confirmed) {
        throw new Error('aborted')
      }
    }
  })
}

exports.handler = async argv => {
  const { dry_run } = argv
  const client = create_client()
  await client.connect()
  try {
    await query({ client, dry_run: false }, 'BEGIN;')

    // ironic. he could create schemas, but he could not save himself.
    await upsert_install(client, argv)

    const migrations = await get_migrations(client, argv)

    for (const { migration_id, name } of migrations) {
      const rollback_file = path.join(
        process.cwd(),
        'db',
        'rollbacks',
        `${migration_id}_${name}.sql`
      )
      let text = null
      try {
        text = await readFile(rollback_file, 'utf-8')
        if (dry_run === false) logger.info(`Rolling back ${name}`)
        await query({ client, dry_run }, text)
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
        logger.warn(`Could not find ${rollback_file}`)
      }
    }

    if (dry_run === false) logger.info('Dropping tracking schema')
    await drop_schema(client, argv)

    await query({ client, dry_run: false }, 'COMMIT;')
  } catch (err) {
    await query({ client, dry_run: false }, 'ROLLBACK;')
    throw err
  } finally {
    await client.end()
  }
}
