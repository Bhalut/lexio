import dataSource from './data-source';

async function run(): Promise<void> {
  await dataSource.initialize();
  const migrations = await dataSource.runMigrations();
  console.log(`Applied ${migrations.length} migration(s).`);
  await dataSource.destroy();
}

run().catch((error) => {
  console.error('Migration run failed:', error);
  process.exit(1);
});
