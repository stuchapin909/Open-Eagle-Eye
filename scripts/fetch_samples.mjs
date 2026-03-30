import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';

const cams = JSON.parse(readFileSync('cameras.json', 'utf8'));
const sgp = cams.filter(c => c.id.startsWith('sgp-')).slice(0, 3);
const on = cams.filter(c => c.id.startsWith('on-')).slice(0, 3);
const targets = [...sgp, ...on];

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
};

for (const c of targets) {
  const r = await axios.get(c.url, { responseType: 'arraybuffer', headers, maxRedirects: 1, timeout: 10000 });
  const fname = `/tmp/test_${c.id}.jpg`;
  writeFileSync(fname, r.data);
  console.log(`${fname} — ${c.city}: ${c.name}`);
}
