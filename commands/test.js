'use strict'

const { connecting } = require('../lib/options')
const { create_client } = require('../lib/db')
const logger = require('../lib/logger')

exports.command = 'test'

exports.describe = 'test database connection'

exports.builder = yargs => connecting(yargs)

exports.handler = async () => {
  const client = create_client()
  const { user, host, database, port } = client

  logger.info(
    'Connecting to postgres://%s@%s:%s/%s',
    user,
    host,
    port,
    database
  )

  await client.connect()
  await client.query('SELECT NOW() as now')
  await client.end()

  logger.info('Success!')
}
