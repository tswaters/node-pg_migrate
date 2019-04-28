'use strict'

const assert = require('assert')
const { promisify } = require('util')
const { join } = require('path')
const { exec: _exec } = require('child_process')
const _rimraf = require('rimraf')
const { Client } = require('pg')
const fixtures = require('./fixtures')
const { replace_migration_with_fixture, table_exists } = require('./util')

const exec = promisify(_exec)
const rimraf = promisify(_rimraf)

const pg_migrate =
  process.env.VSCODE_DEBUGGING === 'true'
    ? `node --inspect-brk ${join(__dirname, '../../bin', 'pg_migrate')}`
    : 'pg_migrate'

const client = new Client()

before(() => client.connect())
beforeEach(() => exec(`${pg_migrate} init`))
beforeEach(() => client.query('BEGIN;'))

afterEach(() => rimraf(join(process.cwd(), 'db')))
afterEach(() => client.query('ROLLBACK;'))
after(() => client.end())

describe('acceptance test', () => {
  it('should work connect properly', async () => {
    const { stdout: test_out } = await exec(`${pg_migrate} test`)
    assert(
      /Success/.test(test_out),
      `did not get success back: got ${test_out}`
    )
  })

  it('should rollback with a bad test', async () => {
    const { stdout: new_migration } = await exec(`${pg_migrate} new test`)
    const { migration_id } = await replace_migration_with_fixture(
      new_migration,
      fixtures.failing_test
    )

    await assert.rejects(
      () => exec(`${pg_migrate} migrate`),
      ({ stderr }) =>
        new RegExp(`Tests failed for ${migration_id}`).test(stderr),
      'migrate was successful'
    )

    const exists = await table_exists(client, 'public', 'test2')
    assert.equal(exists, false, 'test table was created anyway')
  })

  it('should migrate/rollback properly', async () => {
    const { stdout: new_migration } = await exec(`${pg_migrate} new test`)
    const { migration_id } = await replace_migration_with_fixture(
      new_migration,
      fixtures.first
    )

    const { stdout: migrate_out } = await exec(`${pg_migrate} migrate`)
    assert(
      new RegExp(`Migrating ${migration_id}`).test(migrate_out),
      `Migrating text missed, got ${migrate_out}`
    )

    const exists = await table_exists(client, 'public', 'test')
    assert.equal(exists, true, 'test table was not created')

    const { stdout: status_out } = await exec(`${pg_migrate} status`)
    assert(
      new RegExp(migration_id).test(status_out),
      `migration not found in output, got ${status_out}`
    )

    const { stdout: rollback_out } = await exec(`${pg_migrate} rollback`)
    assert(
      new RegExp(migration_id).test(rollback_out),
      `Rolling back text missed, got ${rollback_out}`
    )

    const missing = !(await table_exists(client, 'public', 'test'))
    assert(missing, 'test table was not destroyed')
  })
})
