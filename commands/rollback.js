'use strict'

const { promisify } = require('util')
const path = require('path')
const { readFile: _readFile } = require('fs')

const logger = require('../lib/logger')
const { connecting, migrations } = require('../lib/options')
const {
  query,
  create_client,
  upsert_install,
  rollback_migration,
} = require('../lib/db')

const readFile = promisify(_readFile)

exports.command = 'rollback [step=1]'
exports.describe = 'Rollback a specific migration'

exports.builder = yargs => {
  yargs.option('step', {
    type: 'number',
    describe: 'number of migrations to roll back',
    default: 1,
  })

  migrations(yargs)
  connecting(yargs)
}

exports.handler = async argv => {
  const { dry_run } = argv
  const client = create_client()
  await client.connect()
  try {
    await query({ client, dry_run: false }, 'BEGIN;')
    await upsert_install(client, argv)

    const migrations = await rollback_migration(client, argv)
    if (migrations.length === 0) {
      return logger.info('No migrations exist')
    }

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
      } catch (err) {
        if (err.code !== 'ENOENT') throw err
        logger.warn(`Could not find ${rollback_file}`)
        return await query({ client, dry_run }, 'ROLLBACK;')
      }

      if (dry_run === false)
        logger.info(`Rolling back ${migration_id} - ${name}`)
      await query({ client, dry_run }, text)
    }

    // `rollback_migration` is implemented as `DELETE RETURNING`
    // this runs regardless if dry_run=true; make sure we rollback
    if (dry_run) {
      return await query({ client, dry_run: false }, 'ROLLBACK;')
    } else {
      await query({ client, dry_run: false }, 'COMMIT;')
    }
  } catch (err) {
    await query({ client, dry_run: false }, 'ROLLBACK;')
    throw err
  } finally {
    await client.end()
  }
}
