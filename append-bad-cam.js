import fs from 'fs';

const path = 'cameras.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.push({
  id: "test-fake-broken",
  name: "Fake Broken PR Guard Test",
  url: "https://httpbin.org/status/404",
  city: "TestCity",
  location: "TestLocation",
  timezone: "UTC"
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Appended fake broken camera to cameras.json!");
