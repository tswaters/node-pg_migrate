#!/bin/sh
set -e

./wait-for.sh "postgres:5432"
npm test
