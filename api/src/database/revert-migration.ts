import dataSource from './data-source';

async function revert(): Promise<void> {
  await dataSource.initialize();
  await dataSource.undoLastMigration();
  console.log('Reverted last migration.');
  await dataSource.destroy();
}

revert().catch((error) => {
  console.error('Migration revert failed:', error);
  process.exit(1);
});
