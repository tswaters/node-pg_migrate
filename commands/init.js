'use strict'

const { mkdir: _mkdir } = require('fs')
const { promisify } = require('util')

const mkdir = promisify(_mkdir)
const logger = require('../lib/logger')

exports.command = 'init'

exports.describe = 'write initial config to current directory'

exports.handler = async () => {
  await mkdir_or_ignore('./db')
  await mkdir_or_ignore('./db/migrations')
  await mkdir_or_ignore('./db/rollbacks')
  await mkdir_or_ignore('./db/tests')
}

async function mkdir_or_ignore(dir) {
  try {
    logger.info(`Creating directory: ${dir}`)
    await mkdir(dir)
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err
    }
    logger.debug(`${dir} already exists, moving on`)
  }
}
