const ICCO_REPO_API = 'https://api.github.com/repos/icco/postmortems/contents/data';

function parseFrontmatter(frontmatterText) {
  const result = {};

  if (!frontmatterText || typeof frontmatterText !== 'string') {
    return result;
  }

  const lines = frontmatterText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    // Handle simple comma-separated lists, e.g. "categories: foo, bar"
    if (value.includes(',')) {
      result[key] = value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
    } else {
      // Strip surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }

  return result;
}

async function fetchIcco() {
  try {
    const response = await fetch(ICCO_REPO_API);
    if (!response.ok) {
      throw new Error(`Failed to fetch ICCO repo index: ${response.status} ${response.statusText}`);
    }
    const files = await response.json();

    const incidents = [];
    const filesToFetch = files.filter(f => f.name.endsWith('.md')).slice(0, 20);

    for (const file of filesToFetch) {
      const fileRes = await fetch(file.download_url);
      if (!fileRes.ok) {
        // Skip files that fail to download, but continue processing others
        console.error(`Failed to fetch file ${file.name}: ${fileRes.status} ${fileRes.statusText}`);
        continue;
      }
      const content = await fileRes.text();

      const parts = content.split('---');
      if (parts.length >= 3) {
        const frontmatter = parseFrontmatter(parts[1]);

        if (!frontmatter || typeof frontmatter !== 'object' || Object.keys(frontmatter).length === 0) {
          console.warn(`Skipping malformed file ${file.name}: could not parse frontmatter`);
          continue;
        }

        const body = parts.slice(2).join('---').trim();

        incidents.push({
          id: `icco-${frontmatter.uuid || generateId(frontmatter.company || 'Unknown', frontmatter.url)}`,
          title: frontmatter.product ? `${frontmatter.company} - ${frontmatter.product}` : `${frontmatter.company} Incident`,
          company: frontmatter.company || 'Unknown',
          industry: 'Tech',
          category: (frontmatter.categories && frontmatter.categories[0]) || 'General',
          impact: 'medium',
          date: frontmatter.date || extractDate(body) || '2000-01-01',
          summary: body || 'Summary unavailable',
          impactDetails: [],
          learnings: [],
          sourceUrl: frontmatter.url || 'https://github.com/icco/postmortems',
          sourceLabel: 'icco/postmortems'
        });
      }
    }

    return incidents;
  } catch (error) {
    console.error('Failed to fetch from icco/postmortems:', error.message);
    return [];
  }
}

function generateId(company, url) {
  const hash = Buffer.from(url || 'unknown').toString('hex').substring(0, 8);
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${hash}`;
}

function extractDate(text) {
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return `${yearMatch[0]}-01-01`;

  return null;
}

module.exports = { fetchIcco };
