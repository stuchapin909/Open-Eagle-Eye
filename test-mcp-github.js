import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  console.log("Starting GitHub integration test for MCP tools...");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"]
  });

  const client = new Client(
    { name: "test-client-github", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  console.log("Connected to MCP server.\n");

  console.log("--- Testing submit_local ---");
  console.log("Adding a valid local camera for testing...");
  const addRes = await client.callTool({
    name: "add_local_camera",
    arguments: {
      name: "GitHub Submit Test Cam",
      url: "https://httpbin.org/image/jpeg",
      city: "TestCity",
      location: "TestLocation",
      timezone: "UTC"
    }
  });
  const addParsed = JSON.parse(addRes.content[0].text);
  console.log("Local camera added:", addParsed.id);

  console.log("Submitting local cameras upstream via GitHub issue...");
  const submitRes = await client.callTool({ name: "submit_local", arguments: {} });
  console.log("Submit Response:");
  console.log(JSON.stringify(JSON.parse(submitRes.content[0].text), null, 2));

  console.log("\nCleaning up local camera...");
  await client.callTool({ name: "remove_local", arguments: { cam_id: addParsed.id } });

  console.log("\n--- Testing report_camera ---");
  // Let's report the first camera in the upstream list
  const listRes = await client.callTool({ name: "list_cameras", arguments: { limit: 1 } });
  const listParsed = JSON.parse(listRes.content[0].text);
  if (listParsed.cameras.length > 0) {
    const reportCam = listParsed.cameras[0];
    console.log(`Reporting upstream camera: ${reportCam.name} (${reportCam.id})`);
    
    // Pass 'offline' status
    const reportRes = await client.callTool({ 
      name: "report_camera", 
      arguments: { 
        cam_id: reportCam.id, 
        status: "offline", 
        notes: "Automated test report via MCP client test script" 
      } 
    });
    console.log("Report Response:");
    console.log(JSON.stringify(JSON.parse(reportRes.content[0].text), null, 2));
  } else {
    console.log("Failed to find an upstream camera to report.");
  }

  console.log("\nTesting complete!");
  await transport.close();
}

main().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
