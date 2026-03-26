const axios = require('axios');
const yaml = require('js-yaml');
const crypto = require('crypto');

const ICCO_REPO_API = 'https://api.github.com/repos/icco/postmortems/contents/data';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REQUEST_HEADERS = Object.assign(
  {
    'User-Agent': 'retro-atlas-ingest',
    'Accept': 'application/vnd.github.v3+json'
  },
  GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
);

async function fetchIcco() {
  try {
    const response = await axios.get(ICCO_REPO_API, { headers: GITHUB_REQUEST_HEADERS });
    const files = response.data;

    const incidents = [];
    const markdownFiles = files.filter(f => f.name.endsWith('.md'));

    const maxFilesEnv = process.env.ICCO_MAX_FILES;
    const maxFiles = maxFilesEnv ? parseInt(maxFilesEnv, 10) : 20;

    let filesToFetch = markdownFiles;
    if (maxFiles && maxFiles > 0 && markdownFiles.length > maxFiles) {
      console.log(`ICCO adapter limiting fetched markdown files to ${maxFiles} of ${markdownFiles.length}.`);
      filesToFetch = markdownFiles.slice(0, maxFiles);
    }

    for (const file of filesToFetch) {
      try {
        const fileRes = await axios.get(file.download_url, { headers: GITHUB_REQUEST_HEADERS });
        const content = fileRes.data;

        const parts = content.split('---');
        if (parts.length >= 3) {
          const frontmatter = yaml.load(parts[1]);
          if (!frontmatter || typeof frontmatter !== 'object') {
            console.warn(`Skipping malformed frontmatter in ${file.name}`);
            continue;
          }

          const body = parts.slice(2).join('---').trim();
          const rawCompany = (frontmatter.company || '').trim();
          const company = rawCompany || 'Unknown';

          incidents.push({
            id: `icco-${frontmatter.uuid || generateId(company, frontmatter.url)}`,
            title: frontmatter.product ? `${company} - ${frontmatter.product}` : `${company} Incident`,
            company: company,
            industry: 'Tech',
            category: (frontmatter.categories && frontmatter.categories[0]) || 'General',
            impact: 'medium',
            date: frontmatter.date || extractDate(body) || '2000-01-01',
            summary: body || 'Summary unavailable',
            impactDetails: [],
            learnings: [],
            sourceUrl: frontmatter.url || file.html_url,
            sourceLabel: 'icco/postmortems'
          });
        }
      } catch (fileError) {
        console.error(`Error fetching file ${file.name}:`, fileError.message);
      }
    }

    return incidents;
  } catch (error) {
    console.error('Failed to fetch from icco/postmortems:', error.message);
    return [];
  }
}

function generateId(company, url) {
  const hash = crypto.createHash('sha256').update(url || 'unknown').digest('hex').slice(0, 8);
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
