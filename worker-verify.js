import { chromium } from "playwright-chromium";
import fs from "fs";

async function verifyCam(url) {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    // Try to load the cam URL with a short timeout
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    // Check if any video, image, or canvas exists
    const exists = await page.$('video, img, canvas');
    await browser.close();
    
    return !!exists; // Returns true if it looks active
  } catch (e) {
    if (browser) await browser.close();
    return false; // Returns false if it's definitely unreachable
  }
}

const args = process.argv.slice(2);
const issueData = JSON.parse(args[0]);

console.log(`Worker verifying: ${issueData.cam_id} (${issueData.status})`);

verifyCam(issueData.cam_id).then(isActive => {
  if (!isActive && (issueData.status === 'offline' || issueData.status === 'broken_link')) {
    console.log("VERIFIED_BROKEN");
    // Update the local log (which will be committed by the action)
    const log = JSON.parse(fs.readFileSync("validation-log.json", "utf8"));
    log[issueData.cam_id] = {
      status: issueData.status,
      notes: issueData.notes,
      timestamp: new Date().toISOString(),
      reported_by: "worker_verified"
    };
    fs.writeFileSync("validation-log.json", JSON.stringify(log, null, 2));
    process.exit(0);
  } else if (isActive) {
    console.log("VERIFICATION_FAILED_ACTIVE");
    process.exit(1);
  } else {
    console.log("VERIFICATION_INCONCLUSIVE");
    process.exit(1);
  }
});
