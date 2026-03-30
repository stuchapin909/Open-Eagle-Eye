import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

async function main() {
  console.log("Starting full MCP client test...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"]
  });

  const client = new Client(
    { name: "test-client-full", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP server.\n");

  // 1. check_config
  console.log("--- Testing check_config ---");
  const configRes = await client.callTool({ name: "check_config", arguments: {} });
  console.log("Config status:", JSON.parse(configRes.content[0].text));

  // 2. nearby_cameras
  console.log("\n--- Testing nearby_cameras (near Times Square) ---");
  const nearbyRes = await client.callTool({ name: "nearby_cameras", arguments: { lat: 40.7580, lng: -73.9855, radius_km: 5, limit: 2 } });
  const nearbyParsed = JSON.parse(nearbyRes.content[0].text);
  console.log(`Found ${nearbyParsed.total} cameras near Times Square.`);
  nearbyParsed.cameras.forEach(c => console.log(`  > ${c.name} (${c.distance_km}km awawy)`));

  // 3. get_snapshots (batch)
  if (nearbyParsed.cameras.length >= 2) {
    console.log("\n--- Testing get_snapshots (Batch of 2) ---");
    const ids = nearbyParsed.cameras.slice(0, 2).map(c => c.id);
    const batchRes = await client.callTool({ name: "get_snapshots", arguments: { cam_ids: ids } });
    const batchParsed = JSON.parse(batchRes.content[0].text);
    console.log(`Batch request: ${batchParsed.requested} requested, ${batchParsed.succeeded} succeeded.`);
  }

  // 4. Local Cameras (add, list, remove)
  console.log("\n--- Testing Local Camera Workflow ---");
  const addRes = await client.callTool({
    name: "add_local_camera",
    arguments: {
      name: "Test Fake Camera",
      url: "https://httpbin.org/image/jpeg",
      city: "TestCity",
      location: "TestLocation",
      timezone: "UTC"
    }
  });
  const addParsed = JSON.parse(addRes.content[0].text);
  console.log("Added local camera:", addParsed.name, `(${addParsed.id})`);

  const listLocalRes = await client.callTool({ name: "list_local", arguments: {} });
  const listLocalParsed = JSON.parse(listLocalRes.content[0].text);
  console.log(`Total local cameras: ${listLocalParsed.total}`);

  console.log(`Removing local camera ${addParsed.id}...`);
  const removeRes = await client.callTool({ name: "remove_local", arguments: { cam_id: addParsed.id } });
  console.log("Remove response:", JSON.parse(removeRes.content[0].text));

  console.log("\nTesting complete! (Skipped submit_local and report_camera to avoid spamming GitHub issues)");
  await transport.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
