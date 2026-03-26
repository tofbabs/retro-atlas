const axios = require('axios');
const crypto = require('crypto');

const DANLUU_URL = 'https://raw.githubusercontent.com/danluu/post-mortems/master/README.md';

async function fetchDanLuu() {
  const response = await axios.get(DANLUU_URL);
  const markdown = response.data;

  const incidents = [];
  const lines = markdown.split('\n');

  let currentCategory = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
      continue;
    }

    const match = line.match(/^\[([^\]]+)\]\(([^\)]+)\)\.\s*(.*)/);
    if (match) {
      const company = match[1];
      const sourceUrl = match[2];
      let summary = match[3];

      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== '' && !lines[j].trim().startsWith('[') && !lines[j].trim().startsWith('##')) {
        summary += ' ' + lines[j].trim();
        j++;
      }
      i = j - 1;

      const rawCompany = company.trim();
      const displayCompany = rawCompany || 'Unknown';

      incidents.push({
        id: `danluu-${generateId(displayCompany, sourceUrl)}`,
        title: `${displayCompany} Incident`,
        company: displayCompany,
        industry: 'Tech',
        category: currentCategory || 'General',
        impact: 'medium',
        date: extractDate(summary) || '2000-01-01',
        summary: summary,
        impactDetails: [],
        learnings: [],
        sourceUrl: sourceUrl,
        sourceLabel: 'Dan Luu List'
      });
    }
  }

  return incidents;
}

function generateId(company, url) {
  const hash = crypto.createHash('sha256').update(url || 'unknown').digest('hex').slice(0, 8);
  return `${company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${hash}`;
}

function extractDate(text) {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dateMatch = text.match(/([A-Z][a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s+(\d{4})/);
  if (dateMatch) {
    const month = monthNames.indexOf(dateMatch[1]);
    if (month !== -1) {
      const d = new Date(Date.UTC(dateMatch[3], month, dateMatch[2]));
      return d.toISOString().split('T')[0];
    }
  }

  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return `${yearMatch[0]}-01-01`;

  return null;
}

module.exports = { fetchDanLuu };
