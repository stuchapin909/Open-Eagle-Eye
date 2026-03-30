import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

/**
 * Quick script to test the Open Eagle Eye MCP tools sequentially.
 */

async function main() {
  console.log("Starting MCP client to test Open Eagle Eye...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP server.");

  // 1. Check tools
  const tools = await client.listTools();
  console.log(`\n--- Available Tools (${tools.tools.length}) ---`);
  tools.tools.forEach(t => console.log(`- ${t.name}: ${t.description.split('.')[0]}`));

  // 2. Test 'list_cameras' (limiting to 2 items)
  console.log("\n--- Testing list_cameras ---");
  const listParams = { city: "New York", limit: 2 };
  console.log(`Calling list_cameras with:`, listParams);
  const listRes = await client.callTool({ name: "list_cameras", arguments: listParams });
  const listParsed = JSON.parse(listRes.content[0].text);
  console.log(`Returned cameras: ${listParsed.cameras.length} (Total: ${listParsed.total})`);
  listParsed.cameras.forEach(c => console.log(`  > ${c.id}: ${c.name} (${c.location})`));
  
  if (listParsed.cameras.length > 0) {
    const camId = listParsed.cameras[0].id;
    
    // 3. Test 'get_camera_info'
    console.log(`\n--- Testing get_camera_info for ${camId} ---`);
    const infoRes = await client.callTool({ name: "get_camera_info", arguments: { cam_id: camId } });
    const infoParsed = JSON.parse(infoRes.content[0].text);
    console.log(`Info URL: ${infoParsed.url}`);

    // 4. Test 'get_snapshot'
    console.log(`\n--- Testing get_snapshot for ${camId} ---`);
    try {
      console.log(`Calling get_snapshot... this may take a second...`);
      const snapRes = await client.callTool({ name: "get_snapshot", arguments: { cam_id: camId } });
      const snapParsed = JSON.parse(snapRes.content[0].text);
      if (snapParsed.success) {
        console.log(`Success! File path: ${snapParsed.file_path}`);
        console.log(`Type: ${snapParsed.content_type}, Size: ${snapParsed.size_bytes} bytes`);
        const exists = fs.existsSync(snapParsed.file_path);
        console.log(`File actually exists on disk: ${exists}`);
      } else {
        console.log(`Snapshot returned error: ${snapParsed.error}`);
      }
    } catch(e) {
      console.log(`Tool call error:`, e.message);
    }
  }

  // 5. Test 'search_cameras'
  console.log("\n--- Testing search_cameras ---");
  const searchRes = await client.callTool({ name: "search_cameras", arguments: { query: "sydney", limit: 1 } });
  const searchParsed = JSON.parse(searchRes.content[0].text);
  console.log(`Found ${searchParsed.total} cameras for 'sydney'. First is ${searchParsed.cameras[0]?.name}`);

  // 6. Test 'explore_cameras'
  console.log("\n--- Testing explore_cameras ---");
  const exploreRes = await client.callTool({ name: "explore_cameras", arguments: { count: 1 } });
  const exploreParsed = JSON.parse(exploreRes.content[0].text);
  console.log(`Random camera picked: ${exploreParsed.cameras[0]?.name} in ${exploreParsed.cameras[0]?.country || 'Unknown'}`);

  console.log("\nTesting complete. Closing connection.");
  await transport.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
