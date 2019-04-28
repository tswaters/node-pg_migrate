'use strict'

const { promisify } = require('util')
const { writeFile: _writeFile } = require('fs')
const { sep, join } = require('path')

const writeFile = promisify(_writeFile)

const migration_path = join(process.cwd(), 'db')
const migration_test = new RegExp(`.*\\${sep}(.+?)_(.+?).sql`)

exports.replace_migration_with_fixture = async (stdout, fixture) => {
  const lines = stdout.split('\n')
  if (lines.length === 0) {
    throw new Error('unexpected')
  }
  const [line] = lines
  const [, migration_id, name] = migration_test.exec(line)
  const file_name = `${migration_id}_${name}.sql`

  await Promise.all(
    ['migrations', 'rollbacks', 'tests'].map(async type =>
      writeFile(join(migration_path, type, file_name), fixture[type])
    )
  )

  return { migration_id, name, file_name }
}

exports.table_exists = async (client, schema_name, table_name) => {
  const {
    rows: [{ exists }],
  } = await client.query(
    `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
      );
    `,
    [schema_name, table_name]
  )
  return exists
}
