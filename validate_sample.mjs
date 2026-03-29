import { readFileSync } from 'fs';
import axios from 'axios';
import dns from 'dns/promises';

const cameras = JSON.parse(readFileSync('/root/projects/open-public-cam/cameras.json', 'utf8'));

// Pick 5 from each new source
const sgp = cameras.filter(c => c.id.startsWith('sgp-')).slice(0, 5);
const on = cameras.filter(c => c.id.startsWith('on-')).slice(0, 5);
const targets = [...sgp, ...on];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'image/jpeg,image/png,image/*;q=0.8,*/*;q=0.1',
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

const results = [];

for (const cam of targets) {
  const r = { id: cam.id, city: cam.city, name: cam.name, url: cam.url, coords: cam.coordinates };
  
  // Schema check
  const missing = [];
  if (!cam.id) missing.push('id');
  if (!cam.name) missing.push('name');
  if (!cam.url) missing.push('url');
  if (!cam.city) missing.push('city');
  if (!cam.location) missing.push('location');
  if (!cam.timezone) missing.push('timezone');
  if (missing.length) {
    r.status = 'FAIL';
    r.error = `Missing: ${missing.join(', ')}`;
    results.push(r);
    continue;
  }

  // DNS/SSRF check
  try {
    const url = new URL(cam.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      r.status = 'FAIL';
      r.error = `Bad protocol: ${url.protocol}`;
      results.push(r);
      continue;
    }
    const addrs = await dns.resolve4(url.hostname).catch(() => []);
    if (addrs.length === 0) {
      r.status = 'FAIL';
      r.error = `DNS failed: ${url.hostname}`;
      results.push(r);
      continue;
    }
  } catch (e) {
    r.status = 'FAIL';
    r.error = `URL error: ${e.message.substring(0, 60)}`;
    results.push(r);
    continue;
  }

  // Fetch
  try {
    const resp = await axios.get(cam.url, {
      timeout: 10000,
      headers: HEADERS,
      responseType: 'arraybuffer',
      maxContentLength: 5 * 1024 * 1024,
      maxBodyLength: 5 * 1024 * 1024,
      maxRedirects: 1,
    });
    const ct = resp.headers['content-type'] || '';
    const buf = Buffer.from(resp.data);
    const size = buf.length;

    // Content-type check with magic byte fallback
    let imageType = null;
    if (ct.includes('image/jpeg') || ct.includes('image/png')) {
      imageType = ct.includes('png') ? 'png' : 'jpeg';
    } else {
      const detected = detectImageType(buf);
      if (detected) imageType = detected.includes('png') ? 'png' : 'jpeg';
    }

    if (!imageType) {
      r.status = 'FAIL';
      r.error = `Bad content-type: ${ct}, magic: none, size: ${size}`;
    } else if (size < 1024) {
      r.status = 'FAIL';
      r.error = `Too small: ${size} bytes`;
    } else {
      r.status = 'PASS';
      r.type = imageType;
      r.size = size;
    }
  } catch (e) {
    r.status = 'FAIL';
    r.error = e.message.substring(0, 80);
  }

  results.push(r);
  console.log(`[${r.status}] ${r.id} (${r.city}): ${r.error || `${r.type} ${r.size}B`}`);
}

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`\nResults: ${passed} pass, ${failed} fail out of ${results.length}`);
