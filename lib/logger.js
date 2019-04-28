'use strict'

/* eslint-disable no-console */

let VERBOSITY = 0

Object.defineProperty(exports, 'level', {
  set(level) {
    VERBOSITY = level
  },
})

exports.error = (...args) => VERBOSITY === 0 && console.error(...args)

exports.info = (...args) => VERBOSITY === 0 && console.info(...args)

exports.warn = (...args) => VERBOSITY === 0 && console.warn(...args)

exports.debug = (...args) => VERBOSITY > 0 && console.debug(...args)

exports.trace = (...args) => VERBOSITY > 1 && console.trace(...args)
