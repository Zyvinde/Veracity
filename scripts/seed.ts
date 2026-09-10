import { getDb, seedDatabase, getAllPatientsDb } from '../lib/db';

console.log('Seeding Anterior Health demo database with realistic clearance cases...');
const db = getDb();
seedDatabase(db);
const patients = getAllPatientsDb();
console.log(`Successfully seeded ${patients.length} patients:`);
patients.forEach((p) => {
  console.log(`- [${p.overallStatus}] ${p.name} (${p.mrn}) - ${p.procedureName}`);
});
