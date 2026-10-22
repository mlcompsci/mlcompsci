#!/usr/bin/env node
// Snapshots the last year of the contribution calendar into data/contributions.json,
// which build.mjs turns into assets/contributions.svg.
// Usage: GITHUB_TOKEN=... node scripts/fetch-contributions.mjs   (no dependencies, Node 18+)
// Private contributions are counted only because the profile setting
// "Include private contributions on my profile" is on.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { handle } = JSON.parse(readFileSync(join(ROOT, 'data', 'profile.json'), 'utf8'));
const token = process.env.GITHUB_TOKEN;
if (!token) throw new Error('GITHUB_TOKEN is not set');

const query = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;
const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': handle },
  body: JSON.stringify({ query, variables: { login: handle } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(`GitHub GraphQL ${res.status}: ${JSON.stringify(json.errors ?? json)}`);

const cal = json.data.user.contributionsCollection.contributionCalendar;
const days = cal.weeks.flatMap((w) => w.contributionDays);
// One line per field keeps the daily diff to a couple of lines.
writeFileSync(join(ROOT, 'data', 'contributions.json'), `{
  "login": ${JSON.stringify(handle)},
  "fetched": ${JSON.stringify(new Date().toISOString().slice(0, 10))},
  "total": ${cal.totalContributions},
  "start": ${JSON.stringify(days[0].date)},
  "counts": [${days.map((d) => d.contributionCount).join(',')}]
}
`);
console.log(`✓ data/contributions.json: ${cal.totalContributions} contributions, ${days[0].date} → ${days.at(-1).date}`);
