import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';

const existing = JSON.parse(readFileSync('/root/projects/open-public-cam/cameras.json', 'utf8'));
const alberta = JSON.parse(readFileSync('/tmp/alberta_cameras.json', 'utf8'));
const wsdot = JSON.parse(readFileSync('/tmp/wsdot_cameras.json', 'utf8'));

const existingIds = new Set(existing.map(c => c.id));
let added = 0;

for (const c of [...alberta, ...wsdot]) {
  if (existingIds.has(c.id)) continue;
  existing.push(c);
  existingIds.add(c.id);
  added++;
}

writeFileSync('/root/projects/open-public-cam/cameras.json', JSON.stringify(existing, null, 2));
console.log(`Total: ${existing.length}, Added: ${added}`);

// Now validate samples and fetch screenshots
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Sec-Fetch-Dest': 'image',
  'Sec-Fetch-Mode': 'no-cors',
  'Sec-Fetch-Site': 'cross-site',
};

function detectImageType(buf) {
  if (buf.length < 4) return null;
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  return null;
}

// Test 3 from each new source
const abSample = alberta.slice(0, 3);
const waSample = wsdot.filter(c => c.category === 'highway').slice(0, 3);
const targets = [...abSample, ...waSample];

for (const c of targets) {
  try {
    const resp = await axios.get(c.url, {
      responseType: 'arraybuffer', headers: HEADERS,
      maxRedirects: 1, timeout: 10000,
      maxContentLength: 5 * 1024 * 1024,
    });
    let ct = resp.headers['content-type'] || '';
    const buf = Buffer.from(resp.data);
    let imageType = null;
    if (ct.includes('image/jpeg') || ct.includes('image/png')) {
      imageType = ct.includes('png') ? 'png' : 'jpeg';
    } else {
      const detected = detectImageType(buf);
      if (detected) imageType = detected.includes('png') ? 'png' : 'jpeg';
    }

    const status = imageType && buf.length > 1024 ? 'PASS' : 'FAIL';
    const detail = status === 'PASS' ? `${imageType} ${buf.length}B` : `ct=${ct} size=${buf.length}`;
    console.log(`[${status}] ${c.id} (${c.city}): ${detail}`);

    if (status === 'PASS') {
      const fname = `/tmp/test_${c.id}.jpg`;
      writeFileSync(fname, buf);
      console.log(`  saved: ${fname}`);
    }
  } catch (e) {
    console.log(`[FAIL] ${c.id}: ${e.message.substring(0, 80)}`);
  }
}
