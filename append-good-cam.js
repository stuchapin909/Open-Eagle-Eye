import fs from 'fs';

const path = 'cameras.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Adding a valid HTTP image endpoint (httpbin) that returns a JPEG > 500 bytes and < 5MB
data.push({
  id: "test-fake-good",
  name: "Fake Good PR Guard Test",
  url: "https://httpbin.org/image/jpeg",
  city: "TestCity",
  location: "TestLocation",
  timezone: "UTC"
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log("Appended fake good camera to cameras.json!");
