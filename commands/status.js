'use strict'

const Table = require('terminal-table')
const { connecting, migrations } = require('../lib/options')
const { create_client, upsert_install, get_migrations } = require('../lib/db')

exports.command = 'status'
exports.describe = 'show current status of migrations'

exports.builder = yargs => {
  connecting(yargs)
  migrations(yargs)
}

exports.handler = async argv => {
  const client = create_client()
  await client.connect()
  try {
    await client.query('BEGIN;')
    await upsert_install(client, argv)

    const migrations = await get_migrations(client, argv)

    var table = new Table({
      borderStyle: 2,
      horizontalLine: true,
      rightPadding: 3,
      leftPadding: 3,
    })

    table.push(
      ['migration_id', 'name', 'date_migrated'],
      ...migrations.map(migration => [
        migration.migration_id,
        migration.name,
        migration.date_migrated.toJSON(),
      ])
    )

    table.attrRange({ row: [0, 1] }, { align: 'center', color: 'white' })
    table.attrRange({ row: [1] }, { align: 'left', color: 'gray' })

    /* eslint-disable no-console */
    console.log(table.toString())
    /* eslint-enable */

    await client.query('COMMIT;')
  } catch (err) {
    await client.query('ROLLBACK;')
    throw err
  } finally {
    await client.end()
  }
}
