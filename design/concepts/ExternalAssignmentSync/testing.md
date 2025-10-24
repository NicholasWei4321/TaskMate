[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: ExternalAssignmentSync
# response:

# file: src/concepts/canvas-api.ts

```typescript
// src/concepts/canvas-api.ts

// Mock Canvas API types for consistency, based on typical Canvas assignment structure
interface CanvasAssignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null; // ISO string format for dates
  updated_at: string; // ISO string format for dates
}

// Mock function to simulate Canvas credential validation API call
export async function validateCanvasCredentials(baseUrl: string, apiToken: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate various error conditions for testing purposes
  if (apiToken === "invalid_token_network_error") {
    // A specific token to trigger a simulated network error during validation
    throw new Error('NETWORK_ERROR');
  }
  if (apiToken === "valid_canvas_token") {
    // This token always passes validation
    return true;
  }
  // Any other token is considered invalid for validation
  return false;
}

// Mock function to simulate fetching assignments from Canvas API
export async function fetchCanvasAssignments(baseUrl: string, apiToken: string): Promise<CanvasAssignment[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate various error conditions for testing purposes during polling
  if (apiToken === "invalid_token_after_connect") {
    // This token simulates credentials becoming invalid after initial connection
    throw new Error('INVALID_CREDENTIALS');
  }
  if (apiToken === "rate_limit_token") {
    // This token simulates hitting an API rate limit
    throw new Error('RATE_LIMIT');
  }
  if (apiToken === "network_failure_token") {
    // This token simulates a general network error during data fetching
    throw new Error('NETWORK_ERROR');
  }

  // Returns the globally set mock assignments.
  // This allows tests to control the data returned by the mock API.
  return globalThis.__mockCanvasAssignments || [];
}

// Global variable to hold mock Canvas assignments for `fetchCanvasAssignments`.
// This is used by tests to inject specific assignment data.
globalThis.__mockCanvasAssignments = [];

// Helper function for tests to easily set the mock assignments.
export function setMockCanvasAssignments(assignments: CanvasAssignment[]) {
  globalThis.__mockCanvasAssignments = assignments;
}
```

# file: src/concepts/ExternalAssignmentSyncConcept.test.ts

```typescript
// src/concepts/ExternalAssignmentSyncConcept.test.ts
import { assertEquals, assertExists, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb, freshID } from "@utils/database.ts";
import ExternalAssignmentSyncConcept from "./ExternalAssignmentSyncConcept.ts";
import { setMockCanvasAssignments } from "./canvas-api.ts"; // Import the mock setter for external API data

// Re-declare types for clarity within the test file
type User = string;
type Assignment = string;
type ConnectionDetails = {
  apiToken: string;
  baseUrl: string;
};
type ExternalAssignmentDetails = {
  name: string;
  description?: string;
  dueDate?: number;
};
type RawExternalAssignment = {
  externalId: string;
  details: ExternalAssignmentDetails;
  externalModificationTimestamp: number;
};
type AssignmentToProcess = {
  externalId: string;
  details: ExternalAssignmentDetails;
  externalModificationTimestamp: number;
  existingInternalId: Assignment | null;
};
type ExternalSourceAccountDoc = {
  _id: string;
  owner: User;
  sourceType: string;
  sourceName: string;
  connectionDetails: ConnectionDetails;
  lastSuccessfulPoll?: number;
};
type ExternalAssignmentDoc = {
  _id: string;
  source: string;
  externalId: string;
  internalAssignment: Assignment;
  lastExternalModificationTimestamp: number;
};

// Error return types for assertions
type ErrorResult = { error: string };
type ConnectSourceSuccess = { sourceAccount: string };
type PollExternalSourceSuccess = { rawExternalAssignments: RawExternalAssignment[] };
type IdentifyChangesSuccess = { assignmentsToProcess: AssignmentToProcess[] };
type GetSourcesForUserSuccess = { sources: ExternalSourceAccountDoc[] };
type GetMappedInternalIdSuccess = { internalId: Assignment };
type GetAssignmentsForSourceSuccess = { assignments: ExternalAssignmentDoc[] };


Deno.test("ExternalAssignmentSync Concept", async (t) => {
  const [db, client] = await testDb();
  const concept = new ExternalAssignmentSyncConcept(db);

  // Define test users and mock connection details
  const userA: User = freshID();
  const userB: User = freshID();

  const canvasDetails: ConnectionDetails = {
    apiToken: "valid_canvas_token",
    baseUrl: "https://canvas.instructure.com",
  };
  const githubDetails: ConnectionDetails = { // Mock details for a generic source
    apiToken: "valid_github_token",
    baseUrl: "https://github.com",
  };

  // Ensure mock external API assignments are reset before each test step
  t.beforeEach(() => {
    setMockCanvasAssignments([]);
  });

  await t.step("Actions: connectSource - success", async () => {
    console.log("\n--- Test: connectSource - success ---");
    const result = await concept.connectSource({
      owner: userA,
      sourceType: "Canvas",
      sourceName: "UserA's Canvas",
      details: canvasDetails,
    }) as ConnectSourceSuccess;

    assertExists(result.sourceAccount, "Should return a sourceAccount ID on success");
    const sourceAccountA1 = result.sourceAccount;
    console.log(`Connected source ID: ${sourceAccountA1}`);

    // Verify the source account was added to the state
    const fetchedSources = await concept._getSourcesForUser({ user: userA }) as GetSourcesForUserSuccess;
    assertEquals(fetchedSources.sources.length, 1, "Should find one connected source for userA");
    assertEquals(fetchedSources.sources[0]._id, sourceAccountA1, "Fetched source ID should match");
    assertEquals(fetchedSources.sources[0].owner, userA, "Fetched source owner should match userA");
    assertEquals(fetchedSources.sources[0].sourceName, "UserA's Canvas", "Fetched source name should match");
    console.log("Verified source account in state.");
  });

  await t.step("Actions: connectSource - DuplicateSourceError", async () => {
    console.log("\n--- Test: connectSource - DuplicateSourceError ---");
    // Attempt to connect a source with the same name for the same user
    const result = await concept.connectSource({
      owner: userA,
      sourceType: "Canvas",
      sourceName: "UserA's Canvas", // Same name as previous test
      details: canvasDetails,
    }) as ErrorResult;
    assertExists(result.error, "Should return an error for duplicate source name");
    assertEquals(result.error, "A source with name 'UserA's Canvas' already exists for this user.", "Error message should indicate duplicate source");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: connectSource - InvalidCredentialsError (Canvas)", async () => {
    console.log("\n--- Test: connectSource - InvalidCredentialsError (Canvas) ---");
    const invalidCanvasDetails: ConnectionDetails = {
      apiToken: "wrong_canvas_token", // Mock will fail validation for this token
      baseUrl: "https://canvas.instructure.com",
    };
    const result = await concept.connectSource({
      owner: userA,
      sourceType: "Canvas",
      sourceName: "UserA's Other Canvas",
      details: invalidCanvasDetails,
    }) as ErrorResult;
    assertExists(result.error, "Should return an error for invalid Canvas credentials");
    assertEquals(result.error, "Invalid credentials provided.", "Error message should indicate invalid credentials");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: connectSource - NetworkError (Canvas during validation)", async () => {
    console.log("\n--- Test: connectSource - NetworkError (Canvas during validation) ---");
    const networkErrorDetails: ConnectionDetails = {
      apiToken: "invalid_token_network_error", // Mock will throw network error for this
      baseUrl: "https://canvas.instructure.com",
    };
    const result = await concept.connectSource({
      owner: userA,
      sourceType: "Canvas",
      sourceName: "UserA's Unreachable Canvas",
      details: networkErrorDetails,
    }) as ErrorResult;
    assertExists(result.error, "Should return an error for network issues during Canvas connection");
    assertEquals(result.error, "Network error connecting to external platform.", "Error message should indicate network error");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: connectSource - success for another user/source type", async () => {
    console.log("\n--- Test: connectSource - success for another user/source type ---");
    const result = await concept.connectSource({
      owner: userB,
      sourceType: "GitHub Classroom",
      sourceName: "UserB's GitHub",
      details: githubDetails,
    }) as ConnectSourceSuccess;
    assertExists(result.sourceAccount, "Should return a sourceAccount ID on success");
    const sourceAccountB1 = result.sourceAccount;
    console.log(`Connected source ID: ${sourceAccountB1}`);

    const fetchedSources = await concept._getSourcesForUser({ user: userB }) as GetSourcesForUserSuccess;
    assertEquals(fetchedSources.sources.length, 1, "Should find one connected source for userB");
    assertEquals(fetchedSources.sources[0]._id, sourceAccountB1, "Fetched source ID should match");
    console.log("Verified source account for userB in state.");
  });

  let sourceAccountA1: string; // Will store the ID of userA's canvas source for later tests
  await t.step("Setup: retrieve sourceAccountA1 for subsequent tests", async () => {
    const fetchedSources = await concept._getSourcesForUser({ user: userA }) as GetSourcesForUserSuccess;
    sourceAccountA1 = fetchedSources.sources[0]._id;
    console.log(`Retrieved sourceAccountA1: ${sourceAccountA1}`);
  });

  await t.step("Actions: pollExternalSource - success", async () => {
    console.log("\n--- Test: pollExternalSource - success ---");
    const mockAssignments = [
      {
        id: 101,
        name: "Intro to Deno",
        description: "Your first Deno assignment",
        due_at: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      },
      {
        id: 102,
        name: "MongoDB Basics",
        description: null,
        due_at: null,
        updated_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      },
    ];
    setMockCanvasAssignments(mockAssignments);

    const result = await concept.pollExternalSource({ sourceAccount: sourceAccountA1 }) as PollExternalSourceSuccess;
    assertExists(result.rawExternalAssignments, "Should return rawExternalAssignments on success");
    assertEquals(result.rawExternalAssignments.length, 2, "Should return 2 assignments");
    console.log(`Polled and received ${result.rawExternalAssignments.length} raw external assignments.`);

    // Verify lastSuccessfulPoll was updated in the database
    const updatedSource = await concept.externalSourceAccounts.findOne({ _id: sourceAccountA1 }) as ExternalSourceAccountDoc;
    assertExists(updatedSource.lastSuccessfulPoll, "lastSuccessfulPoll should be updated");
    assertNotEquals(updatedSource.lastSuccessfulPoll, null, "lastSuccessfulPoll should not be null");
    console.log(`lastSuccessfulPoll updated: ${new Date(updatedSource.lastSuccessfulPoll!).toISOString()}`);
  });

  await t.step("Actions: pollExternalSource - SourceConnectionError (invalid credentials after connect)", async () => {
    console.log("\n--- Test: pollExternalSource - SourceConnectionError ---");
    // Temporarily change token in DB to simulate invalid credentials for poll
    await concept.externalSourceAccounts.updateOne({ _id: sourceAccountA1 }, { $set: { "connectionDetails.apiToken": "invalid_token_after_connect" } });

    const result = await concept.pollExternalSource({ sourceAccount: sourceAccountA1 }) as ErrorResult;
    assertExists(result.error, "Should return an error for invalid credentials during poll");
    assertEquals(result.error, "Source connection error: API token expired or invalid.", "Error message should indicate source connection issue");
    console.log(`Received expected error: '${result.error}'`);

    // Restore token for subsequent tests
    await concept.externalSourceAccounts.updateOne({ _id: sourceAccountA1 }, { $set: { "connectionDetails.apiToken": "valid_canvas_token" } });
  });

  await t.step("Actions: pollExternalSource - ApiRateLimitError", async () => {
    console.log("\n--- Test: pollExternalSource - ApiRateLimitError ---");
    // Temporarily change token in DB to simulate rate limit for poll
    await concept.externalSourceAccounts.updateOne({ _id: sourceAccountA1 }, { $set: { "connectionDetails.apiToken": "rate_limit_token" } });

    const result = await concept.pollExternalSource({ sourceAccount: sourceAccountA1 }) as ErrorResult;
    assertExists(result.error, "Should return an error for API rate limit");
    assertEquals(result.error, "External API rate limit exceeded.", "Error message should indicate rate limit");
    console.log(`Received expected error: '${result.error}'`);

    // Restore token
    await concept.externalSourceAccounts.updateOne({ _id: sourceAccountA1 }, { $set: { "connectionDetails.apiToken": "valid_canvas_token" } });
  });

  await t.step("Actions: pollExternalSource - SourceConnectionError (source account not found)", async () => {
    console.log("\n--- Test: pollExternalSource - SourceConnectionError (source account not found) ---");
    const nonExistentSourceId = freshID();
    const result = await concept.pollExternalSource({ sourceAccount: nonExistentSourceId }) as ErrorResult;
    assertExists(result.error, "Should return an error if source account is not found");
    assertEquals(result.error, `Source connection error: account '${nonExistentSourceId}' not found.`, "Error message should indicate source not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: identifyChanges - new assignments", async () => {
    console.log("\n--- Test: identifyChanges - new assignments ---");
    const rawAssignments: RawExternalAssignment[] = [
      {
        externalId: "ext-assign-1",
        details: { name: "New Assignment 1", dueDate: 1679000000000 },
        externalModificationTimestamp: 1678900000000,
      },
      {
        externalId: "ext-assign-2",
        details: { name: "New Assignment 2" },
        externalModificationTimestamp: 1678900000001,
      },
    ];

    const result = await concept.identifyChanges({ sourceAccount: sourceAccountA1, rawExternalAssignments: rawAssignments }) as IdentifyChangesSuccess;
    assertExists(result.assignmentsToProcess, "Should return assignments to process");
    assertEquals(result.assignmentsToProcess.length, 2, "Should identify 2 new assignments");
    assertEquals(result.assignmentsToProcess[0].existingInternalId, null, "New assignments should have null existingInternalId");
    console.log(`Identified ${result.assignmentsToProcess.length} new assignments for processing.`);
  });

  await t.step("Actions: recordInternalSync - create new mapping", async () => {
    console.log("\n--- Test: recordInternalSync - create new mapping ---");
    const rawAssignmentToSync: RawExternalAssignment = {
      externalId: "ext-assign-1",
      details: { name: "New Assignment 1", dueDate: 1679000000000 },
      externalModificationTimestamp: 1678900000000,
    };
    const internalAssign1: Assignment = freshID();

    await concept.recordInternalSync({
      sourceAccount: sourceAccountA1,
      externalId: rawAssignmentToSync.externalId,
      internalId: internalAssign1,
      externalModificationTimestamp: rawAssignmentToSync.externalModificationTimestamp,
    });
    console.log(`Recorded sync for external ID 'ext-assign-1' to internal ID '${internalAssign1}'.`);

    // Verify the mapping was created
    const mapped = await concept._getMappedInternalId({ externalId: "ext-assign-1", sourceAccount: sourceAccountA1 }) as GetMappedInternalIdSuccess;
    assertExists(mapped.internalId, "Should find the mapped internal ID");
    assertEquals(mapped.internalId, internalAssign1, "Mapped internal ID should match");
    console.log("Verified new mapping in state.");
  });

  await t.step("Actions: identifyChanges - updated and unchanged assignments", async () => {
    console.log("\n--- Test: identifyChanges - updated and unchanged assignments ---");
    const rawAssignments: RawExternalAssignment[] = [
      {
        externalId: "ext-assign-1", // Existing, but with an OLDER or SAME timestamp
        details: { name: "New Assignment 1", dueDate: 1679000000000 },
        externalModificationTimestamp: 1678900000000, // Same as recorded, should be unchanged
      },
      {
        externalId: "ext-assign-2", // New (not yet recorded)
        details: { name: "New Assignment 2" },
        externalModificationTimestamp: 1678900000001,
      },
      {
        externalId: "ext-assign-1-updated", // Initially new, then updated to simulate pre-existing
        details: { name: "Updated Assignment 1", description: "Modified" },
        externalModificationTimestamp: 1678900000002,
      },
    ];

    // First, record "ext-assign-1-updated" as an existing internal mapping with an OLDER timestamp
    const internalAssignUpdated: Assignment = freshID();
    await concept.recordInternalSync({
      sourceAccount: sourceAccountA1,
      externalId: "ext-assign-1-updated",
      internalId: internalAssignUpdated,
      externalModificationTimestamp: 1678900000000, // Older timestamp to simulate an update later
    });
    console.log(`Pre-recorded 'ext-assign-1-updated' with internal ID '${internalAssignUpdated}' and older timestamp.`);

    const result = await concept.identifyChanges({ sourceAccount: sourceAccountA1, rawExternalAssignments: rawAssignments }) as IdentifyChangesSuccess;
    assertExists(result.assignmentsToProcess, "Should return assignments to process");
    assertEquals(result.assignmentsToProcess.length, 2, "Should identify 2 assignments (1 new, 1 updated)");

    const newAssignment = result.assignmentsToProcess.find(a => a.externalId === "ext-assign-2");
    assertExists(newAssignment, "Should find the new assignment 'ext-assign-2'");
    assertEquals(newAssignment.existingInternalId, null, "New assignment should have null existingInternalId");
    console.log(`Identified 'ext-assign-2' as new.`);

    const updatedAssignment = result.assignmentsToProcess.find(a => a.externalId === "ext-assign-1-updated");
    assertExists(updatedAssignment, "Should find the updated assignment 'ext-assign-1-updated'");
    assertEquals(updatedAssignment.existingInternalId, internalAssignUpdated, "Updated assignment should have its existing internal ID");
    console.log(`Identified 'ext-assign-1-updated' as updated with existing internal ID '${updatedAssignment.existingInternalId}'.`);

    const unchangedAssignment = result.assignmentsToProcess.find(a => a.externalId === "ext-assign-1");
    assertEquals(unchangedAssignment, undefined, "Assignment 'ext-assign-1' should be considered unchanged and not in the list");
    console.log(`Confirmed 'ext-assign-1' is unchanged and not in the list.`);
  });

  await t.step("Actions: recordInternalSync - update existing mapping", async () => {
    console.log("\n--- Test: recordInternalSync - update existing mapping ---");
    // Retrieve the internal ID mapped to "ext-assign-1-updated"
    const mapped = await concept._getMappedInternalId({ externalId: "ext-assign-1-updated", sourceAccount: sourceAccountA1 }) as GetMappedInternalIdSuccess;
    const internalAssignUpdated: Assignment = mapped.internalId;
    const newTimestamp = 1678900000005; // A newer timestamp

    await concept.recordInternalSync({
      sourceAccount: sourceAccountA1,
      externalId: "ext-assign-1-updated",
      internalId: internalAssignUpdated, // Same internal ID
      externalModificationTimestamp: newTimestamp,
    });
    console.log(`Updated sync for 'ext-assign-1-updated' with new timestamp.`);

    // Verify the mapping was updated in the database
    const updatedMapping = await concept.externalAssignments.findOne({ source: sourceAccountA1, externalId: "ext-assign-1-updated" }) as ExternalAssignmentDoc;
    assertEquals(updatedMapping.lastExternalModificationTimestamp, newTimestamp, "Timestamp should be updated");
    assertEquals(updatedMapping.internalAssignment, internalAssignUpdated, "Internal ID should remain the same");
    console.log("Verified existing mapping was updated in state.");
  });

  await t.step("Actions: identifyChanges - SourceNotFound", async () => {
    console.log("\n--- Test: identifyChanges - SourceNotFound ---");
    const result = await concept.identifyChanges({ sourceAccount: freshID(), rawExternalAssignments: [] }) as ErrorResult;
    assertExists(result.error, "Should return an error if source account is not found");
    assertEquals(result.error, `Source account '${result.error.split("'")[1]}' not found.`, "Error message should indicate source not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: recordInternalSync - SourceNotFound", async () => {
    console.log("\n--- Test: recordInternalSync - SourceNotFound ---");
    const result = await concept.recordInternalSync({
      sourceAccount: freshID(),
      externalId: "some-id",
      internalId: freshID(),
      externalModificationTimestamp: Date.now(),
    }) as ErrorResult;
    assertExists(result.error, "Should return an error if source account is not found");
    assertEquals(result.error, `Source account '${result.error.split("'")[1]}' not found.`, "Error message should indicate source not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Queries: _getSourcesForUser", async () => {
    console.log("\n--- Test: _getSourcesForUser ---");
    const sourcesA = await concept._getSourcesForUser({ user: userA }) as GetSourcesForUserSuccess;
    assertEquals(sourcesA.sources.length, 1, "Should retrieve 1 source for userA");
    assertEquals(sourcesA.sources[0].owner, userA, "Retrieved source should belong to userA");
    console.log(`Retrieved ${sourcesA.sources.length} sources for userA.`);

    const sourcesB = await concept._getSourcesForUser({ user: userB }) as GetSourcesForUserSuccess;
    assertEquals(sourcesB.sources.length, 1, "Should retrieve 1 source for userB");
    assertEquals(sourcesB.sources[0].owner, userB, "Retrieved source should belong to userB");
    console.log(`Retrieved ${sourcesB.sources.length} sources for userB.`);

    const sourcesC = await concept._getSourcesForUser({ user: freshID() }) as GetSourcesForUserSuccess;
    assertEquals(sourcesC.sources.length, 0, "Should retrieve 0 sources for a non-existent user");
    console.log(`Retrieved ${sourcesC.sources.length} sources for non-existent user.`);
  });

  await t.step("Queries: _getMappedInternalId - success", async () => {
    console.log("\n--- Test: _getMappedInternalId - success ---");
    const internalId = await concept._getMappedInternalId({ externalId: "ext-assign-1", sourceAccount: sourceAccountA1 }) as GetMappedInternalIdSuccess;
    assertExists(internalId.internalId, "Should return internalId for existing mapping");
    console.log(`Retrieved mapped internal ID for 'ext-assign-1': '${internalId.internalId}'`);
  });

  await t.step("Queries: _getMappedInternalId - not found", async () => {
    console.log("\n--- Test: _getMappedInternalId - not found ---");
    const result = await concept._getMappedInternalId({ externalId: "non-existent-assign", sourceAccount: sourceAccountA1 }) as ErrorResult;
    assertExists(result.error, "Should return an error for non-existent mapping");
    assertEquals(result.error, `External assignment with ID 'non-existent-assign' not found for source '${sourceAccountA1}'.`, "Error message should indicate not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Queries: _getAssignmentsForSource - success", async () => {
    console.log("\n--- Test: _getAssignmentsForSource - success ---");
    const assignments = await concept._getAssignmentsForSource({ sourceAccount: sourceAccountA1 }) as GetAssignmentsForSourceSuccess;
    assertExists(assignments.assignments, "Should return assignments array");
    assertNotEquals(assignments.assignments.length, 0, "Should return at least one assignment");
    const mappedAssignmentIds = assignments.assignments.map(a => a.externalId);
    assertArrayIncludes(mappedAssignmentIds, ["ext-assign-1", "ext-assign-1-updated"]); // These two were recorded
    console.log(`Retrieved ${assignments.assignments.length} assignments for source '${sourceAccountA1}'.`);
  });

  await t.step("Queries: _getAssignmentsForSource - source not found", async () => {
    console.log("\n--- Test: _getAssignmentsForSource - source not found ---");
    const result = await concept._getAssignmentsForSource({ sourceAccount: freshID() }) as ErrorResult;
    assertExists(result.error, "Should return an error for non-existent source account");
    assertEquals(result.error, "Source account not found", "Error message should indicate source not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Actions: disconnectSource - success (and verify cascading delete)", async () => {
    console.log("\n--- Test: disconnectSource - success ---");
    // Ensure there are assignments associated before disconnecting
    const preDeleteAssignments = await concept.externalAssignments.find({ source: sourceAccountA1 }).toArray();
    assertNotEquals(preDeleteAssignments.length, 0, "Should have assignments before deletion");
    console.log(`Found ${preDeleteAssignments.length} assignments associated with source '${sourceAccountA1}' before disconnect.`);

    const result = await concept.disconnectSource({ sourceAccount: sourceAccountA1 });
    assertEquals(result, {}, "Should return empty object on successful disconnect");
    console.log(`Disconnected source ID: ${sourceAccountA1}`);

    // Verify the source account is removed
    const fetchedSources = await concept._getSourcesForUser({ user: userA }) as GetSourcesForUserSuccess;
    assertEquals(fetchedSources.sources.length, 0, "Should find no connected sources for userA after disconnect");
    console.log("Verified source account removed from state.");

    // Verify all associated external assignments are also removed
    const postDeleteAssignments = await concept.externalAssignments.find({ source: sourceAccountA1 }).toArray();
    assertEquals(postDeleteAssignments.length, 0, "All associated external assignments should be removed after disconnect");
    console.log("Verified all associated external assignments were deleted.");
  });

  await t.step("Actions: disconnectSource - SourceNotFound", async () => {
    console.log("\n--- Test: disconnectSource - SourceNotFound ---");
    const result = await concept.disconnectSource({ sourceAccount: freshID() }) as ErrorResult;
    assertExists(result.error, "Should return an error for non-existent source account");
    assertEquals(result.error, "Source account not found", "Error message should indicate source not found");
    console.log(`Received expected error: '${result.error}'`);
  });

  await t.step("Principle Trace: Full lifecycle of an external assignment source", async () => {
    console.log("\n--- Principle Trace: Full lifecycle ---");
    // The principle describes a full user journey: connect, poll/sync, update, disconnect.

    // 1. User connects an external assignment source with their credentials
    const principleUser = freshID();
    const principleSourceName = "Principle Test Canvas";
    const connectResult = await concept.connectSource({
      owner: principleUser,
      sourceType: "Canvas",
      sourceName: principleSourceName,
      details: canvasDetails,
    }) as ConnectSourceSuccess;
    const principleSourceAccount = connectResult.sourceAccount;
    assertExists(principleSourceAccount, "Principle: Should successfully connect source.");
    console.log(`Principle: Connected source '${principleSourceName}' for user '${principleUser}' with ID '${principleSourceAccount}'.`);

    // 2. System fetches assignments, identifies new items, and application processes them
    setMockCanvasAssignments([
      { id: 201, name: "Proj Alpha", description: "Alpha Desc", due_at: "2024-04-15T23:59:59Z", updated_at: "2024-04-01T10:00:00Z" },
      { id: 202, name: "Proj Beta", description: "Beta Desc", due_at: "2024-04-20T23:59:59Z", updated_at: "2024-04-02T11:00:00Z" },
    ]);
    const pollResult1 = await concept.pollExternalSource({ sourceAccount: principleSourceAccount }) as PollExternalSourceSuccess;
    const rawAssignments1 = pollResult1.rawExternalAssignments;
    assertEquals(rawAssignments1.length, 2, "Principle: Should poll 2 raw assignments.");
    console.log(`Principle: Polled ${rawAssignments1.length} raw assignments initially.`);

    const identifyResult1 = await concept.identifyChanges({ sourceAccount: principleSourceAccount, rawExternalAssignments: rawAssignments1 }) as IdentifyChangesSuccess;
    const assignmentsToProcess1 = identifyResult1.assignmentsToProcess;
    assertEquals(assignmentsToProcess1.length, 2, "Principle: Should identify 2 new assignments for processing.");
    assignmentsToProcess1.forEach(a => assertEquals(a.existingInternalId, null, "Principle: New assignments should have null internal ID."));
    console.log(`Principle: Identified ${assignmentsToProcess1.length} new assignments.`);

    // 3. Application records the internal sync for these new assignments
    const internalAssign201 = freshID();
    const internalAssign202 = freshID();
    await concept.recordInternalSync({
      sourceAccount: principleSourceAccount,
      externalId: "201",
      internalId: internalAssign201,
      externalModificationTimestamp: rawAssignments1[0].externalModificationTimestamp,
    });
    await concept.recordInternalSync({
      sourceAccount: principleSourceAccount,
      externalId: "202",
      internalId: internalAssign202,
      externalModificationTimestamp: rawAssignments1[1].externalModificationTimestamp,
    });
    console.log(`Principle: Recorded internal sync for 'Proj Alpha' (internal: ${internalAssign201}) and 'Proj Beta' (internal: ${internalAssign202}).`);

    // Verify initial mappings are present
    const mapped201 = await concept._getMappedInternalId({ externalId: "201", sourceAccount: principleSourceAccount }) as GetMappedInternalIdSuccess;
    assertEquals(mapped201.internalId, internalAssign201, "Principle: Verify internal ID for external '201'.");
    const mapped202 = await concept._getMappedInternalId({ externalId: "202", sourceAccount: principleSourceAccount }) as GetMappedInternalIdSuccess;
    assertEquals(mapped202.internalId, internalAssign202, "Principle: Verify internal ID for external '202'.");
    console.log("Principle: Verified initial internal mappings are consistent.");

    // 4. Simulate external update to one assignment and addition of another, then poll again
    setMockCanvasAssignments([
      { id: 201, name: "Proj Alpha", description: "Alpha Updated Desc", due_at: "2024-04-16T00:00:00Z", updated_at: "2024-04-03T12:00:00Z" }, // updated timestamp and due_at
      { id: 202, name: "Proj Beta", description: "Beta Desc", due_at: "2024-04-20T23:59:59Z", updated_at: "2024-04-02T11:00:00Z" }, // unchanged
      { id: 203, name: "Proj Gamma", description: "Gamma Desc", due_at: "2024-04-25T23:59:59Z", updated_at: "2024-04-03T13:00:00Z" }, // new assignment
    ]);
    const pollResult2 = await concept.pollExternalSource({ sourceAccount: principleSourceAccount }) as PollExternalSourceSuccess;
    const rawAssignments2 = pollResult2.rawExternalAssignments;
    assertEquals(rawAssignments2.length, 3, "Principle: Should poll 3 raw assignments (1 updated, 1 unchanged, 1 new).");
    console.log(`Principle: Polled ${rawAssignments2.length} raw assignments, including one update and one new.`);

    const identifyResult2 = await concept.identifyChanges({ sourceAccount: principleSourceAccount, rawExternalAssignments: rawAssignments2 }) as IdentifyChangesSuccess;
    const assignmentsToProcess2 = identifyResult2.assignmentsToProcess;
    assertEquals(assignmentsToProcess2.length, 2, "Principle: Should identify 1 updated ('Proj Alpha') and 1 new ('Proj Gamma') assignment.");
    const updatedAssignment = assignmentsToProcess2.find(a => a.externalId === "201");
    assertExists(updatedAssignment, "Principle: Should find updated 'Proj Alpha'.");
    assertEquals(updatedAssignment.existingInternalId, internalAssign201, "Principle: Updated 'Proj Alpha' should have its existing internal ID.");
    const newAssignment = assignmentsToProcess2.find(a => a.externalId === "203");
    assertExists(newAssignment, "Principle: Should find new 'Proj Gamma'.");
    assertEquals(newAssignment.existingInternalId, null, "Principle: New 'Proj Gamma' should have null internal ID.");
    const unchangedAssignment = assignmentsToProcess2.find(a => a.externalId === "202");
    assertEquals(unchangedAssignment, undefined, "Principle: 'Proj Beta' should be unchanged and not in list.");
    console.log("Principle: Identified updated 'Proj Alpha' and new 'Proj Gamma'. 'Proj Beta' is unchanged.");

    // 5. Application records internal sync for updated and new assignments
    const internalAssign203 = freshID();
    await concept.recordInternalSync({
      sourceAccount: principleSourceAccount,
      externalId: updatedAssignment!.externalId,
      internalId: updatedAssignment!.existingInternalId!, // Use existing internal ID for update
      externalModificationTimestamp: updatedAssignment!.externalModificationTimestamp,
    });
    await concept.recordInternalSync({
      sourceAccount: principleSourceAccount,
      externalId: newAssignment!.externalId,
      internalId: internalAssign203, // New internal ID for new assignment
      externalModificationTimestamp: newAssignment!.externalModificationTimestamp,
    });
    console.log(`Principle: Recorded internal sync for updated 'Proj Alpha' and new 'Proj Gamma' (internal: ${internalAssign203}).`);

    // Verify all mappings, including updated timestamp for 201
    const allAssignmentsForSource = await concept._getAssignmentsForSource({ sourceAccount: principleSourceAccount }) as GetAssignmentsForSourceSuccess;
    assertEquals(allAssignmentsForSource.assignments.length, 3, "Principle: Should now have 3 internal mappings.");
    const mappedIds = allAssignmentsForSource.assignments.map(a => a.externalId);
    assertArrayIncludes(mappedIds, ["201", "202", "203"], "Principle: All three external IDs should be mapped.");
    const finalMapped201 = allAssignmentsForSource.assignments.find(a => a.externalId === "201");
    assertEquals(finalMapped201?.lastExternalModificationTimestamp, new Date("2024-04-03T12:00:00Z").getTime(), "Principle: 'Proj Alpha' timestamp should be updated.");
    console.log("Principle: Verified all 3 internal mappings are present and updated.");

    // 6. User revokes access or removes the connection
    await concept.disconnectSource({ sourceAccount: principleSourceAccount });
    console.log(`Principle: Disconnected source '${principleSourceAccount}'.`);

    // Verify connection is gone from state
    const fetchedSourcesAfterDisconnect = await concept._getSourcesForUser({ user: principleUser }) as GetSourcesForUserSuccess;
    assertEquals(fetchedSourcesAfterDisconnect.sources.length, 0, "Principle: Source account should be removed after disconnect.");
    console.log("Principle: Verified source account is removed.");

    // Verify all associated external assignments are delinked/removed
    const assignmentsAfterDisconnect = await concept.externalAssignments.find({ source: principleSourceAccount }).toArray();
    assertEquals(assignmentsAfterDisconnect.length, 0, "Principle: All associated external assignments should be delinked/removed.");
    console.log("Principle: Verified all associated external assignments were deleted.");

    console.log("\n--- Principle Trace Completed Successfully ---");
  });

  await client.close();
});
```