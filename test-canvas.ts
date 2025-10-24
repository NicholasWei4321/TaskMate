// test-canvas.ts
// Quick test script to verify Canvas API integration

import "jsr:@std/dotenv/load";
import { MongoClient } from "npm:mongodb";
import ExternalAssignmentSyncConcept from "./src/concepts/ExternalAssignmentSync/ExternalAssignmentSyncConcept.ts";

const CANVAS_TOKEN = Deno.env.get("CANVAS_API_TOKEN");
const CANVAS_URL = Deno.env.get("CANVAS_BASE_URL") || "https://canvas.mit.edu";
const MONGODB_URL = Deno.env.get("MONGODB_URL");
const DB_NAME = Deno.env.get("DB_NAME") || "TaskMateDB";

if (!CANVAS_TOKEN) {
  console.error("❌ CANVAS_API_TOKEN not set in .env file");
  Deno.exit(1);
}

if (!MONGODB_URL) {
  console.error("❌ MONGODB_URL not set in .env file");
  Deno.exit(1);
}

console.log("🧪 Testing Canvas API Integration\n");

// Connect to MongoDB
console.log("📦 Connecting to MongoDB...");
const client = new MongoClient(MONGODB_URL);
await client.connect();
const db = client.db(DB_NAME);
console.log("✅ Connected to MongoDB\n");

// Create concept instance
const concept = new ExternalAssignmentSyncConcept(db);
const testUserId = "test-user-123";

try {
  console.log("1️⃣  Testing connectSource...");
  const connectResult = await concept.connectSource({
    owner: testUserId,
    sourceType: "Canvas",
    sourceName: "My Canvas Courses (Test)",
    details: {
      apiToken: CANVAS_TOKEN,
      baseUrl: CANVAS_URL,
    },
  });

  if ("error" in connectResult) {
    console.error(`❌ Failed to connect: ${connectResult.error}`);
    await client.close();
    Deno.exit(1);
  }

  console.log(`✅ Successfully connected to Canvas!`);
  console.log(`   Source Account ID: ${connectResult.sourceAccount}\n`);

  console.log("2️⃣  Testing pollExternalSource (fetching assignments)...");
  const pollResult = await concept.pollExternalSource({
    sourceAccount: connectResult.sourceAccount,
  });

  if ("error" in pollResult) {
    console.error(`❌ Failed to poll: ${pollResult.error}`);
    await client.close();
    Deno.exit(1);
  }

  console.log(`✅ Successfully fetched ${pollResult.rawExternalAssignments.length} assignments from Canvas!\n`);

  console.log("📋 Assignments:");
  console.log("================");
  for (const assignment of pollResult.rawExternalAssignments.slice(0, 5)) {
    console.log(`\n  ID: ${assignment.externalId}`);
    console.log(`  Name: ${assignment.details.name}`);
    console.log(`  Description: ${assignment.details.description?.substring(0, 50) || 'N/A'}...`);
    console.log(`  Due Date: ${assignment.details.dueDate ? new Date(assignment.details.dueDate).toLocaleDateString() : 'N/A'}`);
    console.log(`  Last Modified: ${new Date(assignment.externalModificationTimestamp).toLocaleString()}`);
  }

  if (pollResult.rawExternalAssignments.length > 5) {
    console.log(`\n  ... and ${pollResult.rawExternalAssignments.length - 5} more assignments`);
  }

  console.log("\n3️⃣  Testing identifyChanges (all should be new)...");
  const changesResult = await concept.identifyChanges({
    sourceAccount: connectResult.sourceAccount,
    rawExternalAssignments: pollResult.rawExternalAssignments,
  });

  if ("error" in changesResult) {
    console.error(`❌ Failed to identify changes: ${changesResult.error}`);
    await client.close();
    Deno.exit(1);
  }

  console.log(`✅ Identified ${changesResult.assignmentsToProcess.length} new/updated assignments`);
  console.log(`   (All should be new since this is first sync)\n`);

  console.log("4️⃣  Cleaning up test data...");
  await concept.disconnectSource({
    sourceAccount: connectResult.sourceAccount,
  });
  console.log("✅ Test data cleaned up\n");

  console.log("🎉 All tests passed! Canvas integration is working correctly.");

} catch (error) {
  console.error(`❌ Test failed with error: ${error}`);
} finally {
  await client.close();
  console.log("\n📦 Disconnected from MongoDB");
}
