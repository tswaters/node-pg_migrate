
psql -v ON_ERROR_STOP=1 <<-EOSQL
  DROP DATABASE IF EXISTS pgmigrate_test;
  CREATE DATABASE pgmigrate_test;
  ALTER ROLE postgres WITH PASSWORD 'test';
EOSQL
