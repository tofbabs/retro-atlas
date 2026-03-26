const fs = require('fs');
const path = require('path');
const { fetchDanLuu } = require('./adapters/danluu');
const { fetchIcco } = require('./adapters/icco');

const INCIDENTS_FILE = path.join(__dirname, '../mock-ui/data/incidents.json');

async function main() {
  console.log('Starting ingestion...');

  let existingIncidents = [];
  if (fs.existsSync(INCIDENTS_FILE)) {
    existingIncidents = JSON.parse(fs.readFileSync(INCIDENTS_FILE, 'utf8'));
  }

  const danLuuIncidents = await fetchDanLuu();
  console.log(`Fetched ${danLuuIncidents.length} incidents from Dan Luu.`);

  const iccoIncidents = await fetchIcco();
  console.log(`Fetched ${iccoIncidents.length} incidents from icco/postmortems.`);

  const allNewIncidents = [...danLuuIncidents, ...iccoIncidents];

  let mergedCount = 0;
  for (const newIncident of allNewIncidents) {
    const exists = existingIncidents.some(inc => inc.sourceUrl === newIncident.sourceUrl);
    if (!exists) {
      existingIncidents.push(newIncident);
      mergedCount++;
    }
  }

  console.log(`Merged ${mergedCount} new incidents.`);

  existingIncidents.sort((a, b) => new Date(b.date) - new Date(a.date));

  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(existingIncidents, null, 2));
  console.log('Ingestion complete. Updated incidents.json.');
}

main().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
