'use strict'

const { promisify } = require('util')
const { writeFile: _writeFile, readFile: _readFile } = require('fs')
const path = require('path')
const logger = require('../lib/logger')

const writeFile = promisify(_writeFile)
const readFile = promisify(_readFile)

const default_path = path.join(__dirname, '..', 'templates')
let migration_template = ''
let rollback_template = ''
let test_template = ''

exports.command = 'new <name>'
exports.describe = 'create a new migration'

exports.builder = yargs =>
  yargs

    .group(['templateDir'], 'New migration options')

    .option('templateDir', {
      type: 'string',
      describe: 'directory to pull templates from',
      default: default_path,
    })

    .middleware(async argv => {
      migration_template = await get_template_fallback(argv, 'migration.sql')
      rollback_template = await get_template_fallback(argv, 'rollback.sql')
      test_template = await get_template_fallback(argv, 'test.sql')
    })

exports.handler = async ({ name }) => {
  const migration_name = name.replace(/\s/g, '-').toLowerCase()
  const file_name = `${new Date().getTime()}_${migration_name}.sql`
  await make_file('migrations', file_name, migration_template)
  await make_file('rollbacks', file_name, rollback_template)
  await make_file('tests', file_name, test_template)
}

async function get_template_fallback({ templateDir }, template) {
  const definedPath = path.join(templateDir, template)
  const defaultPath = path.join(default_path, template)
  try {
    return readFile(definedPath, 'utf-8')
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
    return readFile(defaultPath, 'utf-8')
  }
}

async function make_file(migration_path, file_name, template) {
  const file_path = path.join(process.cwd(), 'db', migration_path, file_name)
  logger.info(`Creating file: ${file_path}`)
  await writeFile(file_path, template)
}
