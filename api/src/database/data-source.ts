import { DataSource } from 'typeorm';

import { createDatabaseOptions } from './database-options';

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/lexio';

const dataSource = new DataSource(
  createDatabaseOptions({
    url,
    synchronize: false,
    migrationsRun: false,
    logging: process.env.NODE_ENV !== 'production',
  }),
);

export default dataSource;
