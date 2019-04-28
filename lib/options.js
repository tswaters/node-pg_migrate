'use strict'

exports.connecting = yargs =>
  yargs
    .group(
      ['pg-user', 'pg-password', 'pg-host', 'pg-database', 'pg-port'],
      'Connection options'
    )
    .option('pg-user', {
      type: 'string',
      describe: 'User to run as',
    })
    .option('pg-password', {
      type: 'string',
      describe: 'DONT USE THIS; provide PGPASSWORD OR .pgpass!',
    })
    .option('pg-host', {
      type: 'string',
      describe: 'Host to run against',
    })
    .option('pg-database', {
      type: 'string',
      describe: 'Database to run against',
    })
    .option('pg-port', {
      type: 'number',
      describe: 'Port to run against',
    })

exports.migrations = yargs =>
  yargs
    .group(['tablename', 'schema'], 'Migration options')
    .option('tablename', {
      type: 'string',
      describe: 'table to use for storing migration data',
      default: 'migrations',
    })
    .option('schema', {
      type: 'string',
      describe: 'schema to use for storing migration data',
      default: 'migrate',
    })
    .option('dry-run', {
      type: 'boolean',
      alias: ['dry_run'],
      describe: 'dont run anything, log out what will be run',
      default: false,
    })
    .option('run-tests', {
      type: 'boolean',
      alias: 'run_tests',
      describe: 'run tests as part of the migrate',
      default: true,
    })
