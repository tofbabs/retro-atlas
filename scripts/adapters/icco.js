const axios = require('axios');
const crypto = require('crypto');
const yaml = require('js-yaml');

const ICCO_REPO_API = 'https://api.github.com/repos/icco/postmortems/contents/data';

async function fetchIcco() {
  try {
    const response = await axios.get(ICCO_REPO_API);
    const files = response.data;

    const incidents = [];
    const filesToFetch = files.filter(f => f.name.endsWith('.md')).slice(0, 20);

    for (const file of filesToFetch) {
      const fileRes = await axios.get(file.download_url);
      const content = fileRes.data;

      const parts = content.split('---');
      if (parts.length >= 3) {
        const frontmatter = yaml.load(parts[1]);
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
  const hash = crypto.createHash('sha256').update(url || 'unknown').digest('hex').substring(0, 8);
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
