DO $$
BEGIN

  -- todo: perform assertions
  ASSERT TRUE;

  RAISE EXCEPTION 'Test pass';
  EXCEPTION WHEN RAISE_EXCEPTION THEN RETURN;

END $$
LANGUAGE PLPGSQL;
