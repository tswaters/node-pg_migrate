'use strict'

const prompts = require('prompts')

exports.danger = async message => {
  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message,
    initial: false,
  })

  return confirmed
}
