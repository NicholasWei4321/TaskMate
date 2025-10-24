---
timestamp: 'Thu Oct 23 2025 19:30:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_193016.1b32171a.md]]'
content_id: 6f5458bbb5c007f72b87f974c3c4bd6c73315b54c3b9d1d05c0bc19d1eb25a82
---

# file: src/concepts/UserAuthenticationConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";
import { ID } from "@utils/types.ts";

Deno.test("UserAuthentication Concept Tests", async (t) => {
  const [db, client] = await testDb();
  const concept = new UserAuthenticationConcept(db);

  // Helper to clear collections before each test (though testDb() drops db)
  // Deno.test.beforeEach(async () => {
  //   await db.dropDatabase();
  // });

  await t.step("Action: register - successful registration", async () => {
    console.log("--- Test: register - successful registration ---");
    const username = "testuser";
    const password = "password123";

    console.log(`Attempting to register user: ${username}`);
    const result = await concept.register({ username, password });

    assertExists((result as { user: ID }).user, "User ID should be returned on successful registration");
    assertNotEquals((result as { user: ID }).user, "", "User ID should not be empty");

    const userId = (result as { user: ID }).user;
    console.log(`Registered user with ID: ${userId}`);

    // Verify state: user should exist in the database
    const userDoc = await concept.users.findOne({ _id: userId });
    assertExists(userDoc, "User should be found in the database after registration");
    assertEquals(userDoc?.username, username, "Registered username should match");
    assertExists(userDoc?.hashedPassword, "Hashed password should be stored");
    assertEquals(
      Object.keys(userDoc?.additionalCredentials || {}).length,
      0,
      "Additional credentials should be empty initially",
    );
    console.log("State verified: user document created successfully.");
  });

  await t.step("Action: register - username already taken", async () => {
    console.log("--- Test: register - username already taken ---");
    const username = "existinguser";
    const password = "password123";

    // First, register the user successfully
    console.log(`Registering initial user: ${username}`);
    const initialResult = await concept.register({ username, password });
    assertExists((initialResult as { user: ID }).user, "Initial registration should succeed");
    console.log(`Initial user registered with ID: ${(initialResult as { user: ID }).user}`);

    // Attempt to register with the same username
    console.log(`Attempting to register user with duplicate username: ${username}`);
    const duplicateResult = await concept.register({ username, password: "anotherpassword" });

    assertEquals(
      (duplicateResult as { error: string }).error,
      "Username already taken",
      "Should return 'Username already taken' error",
    );
    console.log(`Error received: ${(duplicateResult as { error: string }).error}`);

    // Verify state: no new user should be created
    const userCount = await concept.users.countDocuments({ username });
    assertEquals(userCount, 1, "Only one user with this username should exist");
    console.log("State verified: no new user created for duplicate username.");
  });

  await t.step("Action: login - successful login", async () => {
    console.log("--- Test: login - successful login ---");
    const username = "loginuser";
    const password = "loginpass";

    // Register user first
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    console.log(`Registered user ${username} with ID: ${userId}`);

    console.log(`Attempting to login user: ${username}`);
    const loginResult = await concept.login({ username, password });

    assertExists(
      (loginResult as { sessionToken: string }).sessionToken,
      "Session token should be returned on successful login",
    );
    assertNotEquals(
      (loginResult as { sessionToken: string }).sessionToken,
      "",
      "Session token should not be empty",
    );

    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in successfully, session token: ${sessionToken}`);

    // Verify state: active session should exist
    const sessionDoc = await concept.activeSessions.findOne({ sessionToken });
    assertExists(sessionDoc, "Active session should be found in the database");
    assertEquals(sessionDoc?.user, userId, "Session should be linked to the correct user");
    console.log("State verified: active session created.");
  });

  await t.step("Action: login - invalid username or password", async () => {
    console.log("--- Test: login - invalid username or password ---");
    const username = "nonexistent";
    const password = "badpassword";

    console.log(`Attempting to login with invalid credentials for user: ${username}`);
    const result = await concept.login({ username, password });

    assertEquals(
      (result as { error: string }).error,
      "Invalid username or password",
      "Should return 'Invalid username or password' error for bad credentials",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);

    // Verify state: no active session should be created
    const sessionCount = await concept.activeSessions.countDocuments({ user: username as ID }); // Cast to ID for type safety
    assertEquals(sessionCount, 0, "No active session should be created for invalid login");
    console.log("State verified: no active session created.");
  });

  await t.step("Action: logout - successful logout", async () => {
    console.log("--- Test: logout - successful logout ---");
    const username = "logoutuser";
    const password = "logoutpass";

    // Register and login user to get a session token
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username}, session token: ${sessionToken}`);

    console.log(`Attempting to logout with session token: ${sessionToken}`);
    const logoutResult = await concept.logout({ sessionToken });

    assertEquals((logoutResult as { success: boolean }).success, true, "Logout should be successful");
    console.log("Logout successful.");

    // Verify state: session should no longer exist
    const sessionDoc = await concept.activeSessions.findOne({ sessionToken });
    assertEquals(sessionDoc, null, "Active session should be removed after logout");
    console.log("State verified: active session removed.");
  });

  await t.step("Action: logout - invalid session token", async () => {
    console.log("--- Test: logout - invalid session token ---");
    const invalidToken = "nonexistent_token";

    console.log(`Attempting to logout with invalid session token: ${invalidToken}`);
    const result = await concept.logout({ sessionToken: invalidToken });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token",
      "Should return 'Invalid session token' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
    console.log("State verified: no change to active sessions.");
  });

  await t.step("Action: getCurrentUser - successful retrieval", async () => {
    console.log("--- Test: getCurrentUser - successful retrieval ---");
    const username = "currentuser";
    const password = "currentpass";

    // Register and login user
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username} (ID: ${userId}), session token: ${sessionToken}`);

    console.log(`Attempting to get current user for session token: ${sessionToken}`);
    const currentUserResult = await concept.getCurrentUser({ sessionToken });

    assertEquals(
      (currentUserResult as { user: ID }).user,
      userId,
      "Should return the correct user ID for the active session",
    );
    console.log(`Retrieved user ID: ${(currentUserResult as { user: ID }).user}`);
  });

  await t.step("Action: getCurrentUser - invalid session token", async () => {
    console.log("--- Test: getCurrentUser - invalid session token ---");
    const invalidToken = "unknown_session";

    console.log(`Attempting to get current user for invalid session token: ${invalidToken}`);
    const result = await concept.getCurrentUser({ sessionToken: invalidToken });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token",
      "Should return 'Invalid session token' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: storeCredential - successful storage", async () => {
    console.log("--- Test: storeCredential - successful storage ---");
    const username = "creduser";
    const password = "credpass";
    const credentialType = "GitHub";
    const credentialValue = "ghp_1234567890abcdef";

    // Register and login user
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username} (ID: ${userId}), session token: ${sessionToken}`);

    console.log(`Storing credential type '${credentialType}' for user.`);
    const storeResult = await concept.storeCredential({
      sessionToken,
      credentialType,
      credentialValue,
    });

    assertEquals((storeResult as { success: boolean }).success, true, "Credential storage should be successful");
    console.log("Credential stored successfully.");

    // Verify state: user's additionalCredentials should contain the new entry
    const userDoc = await concept.users.findOne({ _id: userId });
    assertEquals(
      userDoc?.additionalCredentials[credentialType],
      credentialValue,
      "Stored credential value should match",
    );
    console.log("State verified: credential stored in user document.");
  });

  await t.step("Action: storeCredential - invalid session token", async () => {
    console.log("--- Test: storeCredential - invalid session token ---");
    const invalidToken = "bad_session";
    const credentialType = "Twitter";
    const credentialValue = "tw_token";

    console.log(`Attempting to store credential with invalid session token: ${invalidToken}`);
    const result = await concept.storeCredential({
      sessionToken: invalidToken,
      credentialType,
      credentialValue,
    });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token", // Matches the specific error for session not found from the implementation
      "Should return 'Invalid session token' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: storeCredential - empty credential type", async () => {
    console.log("--- Test: storeCredential - empty credential type ---");
    const username = "emptycrduser";
    const password = "pass";

    // Register and login user
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username}, session token: ${sessionToken}`);

    const credentialType = ""; // Empty string
    const credentialValue = "somevalue";

    console.log("Attempting to store credential with empty credential type.");
    const result = await concept.storeCredential({
      sessionToken,
      credentialType,
      credentialValue,
    });

    assertEquals(
      (result as { error: string }).error,
      "Credential type cannot be empty",
      "Should return 'Credential type cannot be empty' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: retrieveCredential - successful retrieval", async () => {
    console.log("--- Test: retrieveCredential - successful retrieval ---");
    const username = "retuser";
    const password = "retpass";
    const credentialType = "Slack";
    const credentialValue = "xoxb-12345";

    // Register, login, and store credential
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    await concept.storeCredential({ sessionToken, credentialType, credentialValue });
    console.log(
      `Logged in user ${username} (ID: ${userId}), session token: ${sessionToken}. Credential stored.`,
    );

    console.log(`Retrieving credential type '${credentialType}'.`);
    const retrieveResult = await concept.retrieveCredential({
      sessionToken,
      credentialType,
    });

    assertEquals(
      (retrieveResult as { credentialValue: string }).credentialValue,
      credentialValue,
      "Retrieved credential value should match",
    );
    console.log(`Retrieved credential: ${(retrieveResult as { credentialValue: string }).credentialValue}`);
  });

  await t.step("Action: retrieveCredential - invalid session token", async () => {
    console.log("--- Test: retrieveCredential - invalid session token ---");
    const invalidToken = "bad_session_for_retrieve";
    const credentialType = "Jira";

    console.log(`Attempting to retrieve credential with invalid session token: ${invalidToken}`);
    const result = await concept.retrieveCredential({
      sessionToken: invalidToken,
      credentialType,
    });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token or credential type not found", // Specific error from implementation
      "Should return 'Invalid session token' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: retrieveCredential - credential type not found", async () => {
    console.log("--- Test: retrieveCredential - credential type not found ---");
    const username = "notfounduser";
    const password = "pass";
    const credentialType = "Confluence";
    const nonExistentType = "Asana";

    // Register, login, and store one credential
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    await concept.storeCredential({ sessionToken, credentialType, credentialValue: "conf_token" });
    console.log(`Logged in user ${username}, session token: ${sessionToken}. Stored '${credentialType}'.`);

    console.log(`Attempting to retrieve non-existent credential type: '${nonExistentType}'.`);
    const result = await concept.retrieveCredential({
      sessionToken,
      credentialType: nonExistentType,
    });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token or credential type not found",
      "Should return 'credential type not found' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: updateCredential - successful update", async () => {
    console.log("--- Test: updateCredential - successful update ---");
    const username = "upduser";
    const password = "updpass";
    const credentialType = "Azure";
    const initialValue = "az_old_token";
    const newValue = "az_new_token";

    // Register, login, and store initial credential
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    await concept.storeCredential({
      sessionToken,
      credentialType,
      credentialValue: initialValue,
    });
    console.log(
      `Logged in user ${username} (ID: ${userId}), session token: ${sessionToken}. Stored '${credentialType}' with value '${initialValue}'.`,
    );

    console.log(`Updating credential type '${credentialType}' to new value.`);
    const updateResult = await concept.updateCredential({
      sessionToken,
      credentialType,
      newCredentialValue: newValue,
    });

    assertEquals((updateResult as { success: boolean }).success, true, "Credential update should be successful");
    console.log("Credential updated successfully.");

    // Verify state: retrieve and check updated value
    const retrieved = await concept.retrieveCredential({ sessionToken, credentialType });
    assertEquals(
      (retrieved as { credentialValue: string }).credentialValue,
      newValue,
      "Retrieved value should match the new credential value",
    );
    console.log("State verified: credential value updated.");
  });

  await t.step("Action: updateCredential - credential type not found", async () => {
    console.log("--- Test: updateCredential - credential type not found ---");
    const username = "updnotfound";
    const password = "pass";
    const nonExistentType = "NonexistentCred";
    const newValue = "some_value";

    // Register and login user
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username}, session token: ${sessionToken}.`);

    console.log(`Attempting to update non-existent credential type: '${nonExistentType}'.`);
    const result = await concept.updateCredential({
      sessionToken,
      credentialType: nonExistentType,
      newCredentialValue: newValue,
    });

    assertEquals(
      (result as { error: string }).error,
      "Credential type not found for this user",
      "Should return 'Credential type not found' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: deleteCredential - successful deletion", async () => {
    console.log("--- Test: deleteCredential - successful deletion ---");
    const username = "deluser";
    const password = "delpass";
    const credentialType = "Google";
    const credentialValue = "goog_token";

    // Register, login, and store credential
    const registerResult = await concept.register({ username, password });
    const userId = (registerResult as { user: ID }).user;
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    await concept.storeCredential({
      sessionToken,
      credentialType,
      credentialValue,
    });
    console.log(
      `Logged in user ${username} (ID: ${userId}), session token: ${sessionToken}. Stored '${credentialType}'.`,
    );

    console.log(`Deleting credential type: '${credentialType}'.`);
    const deleteResult = await concept.deleteCredential({
      sessionToken,
      credentialType,
    });

    assertEquals((deleteResult as { success: boolean }).success, true, "Credential deletion should be successful");
    console.log("Credential deleted successfully.");

    // Verify state: credential should no longer be present
    const userDoc = await concept.users.findOne({ _id: userId });
    assertEquals(
      userDoc?.additionalCredentials[credentialType],
      undefined,
      "Deleted credential should not exist in user's additionalCredentials",
    );
    console.log("State verified: credential removed from user document.");
  });

  await t.step("Action: deleteCredential - credential type not found", async () => {
    console.log("--- Test: deleteCredential - credential type not found ---");
    const username = "delnotfound";
    const password = "pass";
    const nonExistentType = "MissingCred";

    // Register and login user
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`Logged in user ${username}, session token: ${sessionToken}.`);

    console.log(`Attempting to delete non-existent credential type: '${nonExistentType}'.`);
    const result = await concept.deleteCredential({
      sessionToken,
      credentialType: nonExistentType,
    });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token or credential type not found",
      "Should return 'Credential type not found' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Action: getCredentialTypes - successful retrieval", async () => {
    console.log("--- Test: getCredentialTypes - successful retrieval ---");
    const username = "gettypesuser";
    const password = "pass";
    const credType1 = "Zoom";
    const credVal1 = "zoom_token";
    const credType2 = "Trello";
    const credVal2 = "trello_token";

    // Register, login, and store multiple credentials
    await concept.register({ username, password });
    const loginResult = await concept.login({ username, password });
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    await concept.storeCredential({ sessionToken, credentialType: credType1, credentialValue: credVal1 });
    await concept.storeCredential({ sessionToken, credentialType: credType2, credentialValue: credVal2 });
    console.log(
      `Logged in user ${username}, session token: ${sessionToken}. Stored '${credType1}' and '${credType2}'.`,
    );

    console.log("Retrieving all credential types.");
    const typesResult = await concept.getCredentialTypes({ sessionToken });

    assertExists((typesResult as { types: string[] }).types, "Should return an array of types");
    assertEquals(
      (typesResult as { types: string[] }).types.sort(),
      [credType1, credType2].sort(),
      "Should return all stored credential types",
    );
    console.log(`Retrieved types: ${(typesResult as { types: string[] }).types.join(", ")}`);
  });

  await t.step("Action: getCredentialTypes - invalid session token", async () => {
    console.log("--- Test: getCredentialTypes - invalid session token ---");
    const invalidToken = "bad_session_for_gettypes";

    console.log(`Attempting to get credential types with invalid session token: ${invalidToken}`);
    const result = await concept.getCredentialTypes({ sessionToken: invalidToken });

    assertEquals(
      (result as { error: string }).error,
      "Invalid session token",
      "Should return 'Invalid session token' error",
    );
    console.log(`Error received: ${(result as { error: string }).error}`);
  });

  await t.step("Principle: User Authentication Flow", async () => {
    console.log("--- Principle Test: User Authentication Flow ---");
    const username = "principleuser";
    const password = "principlepass";
    const credentialType = "Dropbox";
    const credentialValue = "dbx_token_123";

    console.log("1. Register a new user.");
    const registerResult = await concept.register({ username, password });
    assertExists((registerResult as { user: ID }).user, "User should be registered successfully");
    const userId = (registerResult as { user: ID }).user;
    console.log(`   User '${username}' registered with ID: ${userId}`);

    console.log("2. Login with the registered user.");
    const loginResult = await concept.login({ username, password });
    assertExists((loginResult as { sessionToken: string }).sessionToken, "Login should be successful");
    const sessionToken = (loginResult as { sessionToken: string }).sessionToken;
    console.log(`   Logged in successfully, session token: ${sessionToken}`);

    console.log("3. Store a credential while logged in.");
    const storeResult = await concept.storeCredential({ sessionToken, credentialType, credentialValue });
    assertEquals((storeResult as { success: boolean }).success, true, "Credential should be stored successfully");
    console.log(`   Credential '${credentialType}' stored.`);

    console.log("4. Retrieve the credential while logged in.");
    const retrieveResult = await concept.retrieveCredential({ sessionToken, credentialType });
    assertEquals(
      (retrieveResult as { credentialValue: string }).credentialValue,
      credentialValue,
      "Retrieved credential should match stored value",
    );
    console.log(`   Retrieved credential: ${(retrieveResult as { credentialValue: string }).credentialValue}`);

    console.log("5. Logout the user.");
    const logoutResult = await concept.logout({ sessionToken });
    assertEquals((logoutResult as { success: boolean }).success, true, "Logout should be successful");
    console.log("   User logged out.");

    console.log("6. Attempt to retrieve credential after logging out (should fail).");
    const postLogoutRetrieveResult = await concept.retrieveCredential({
      sessionToken,
      credentialType,
    });
    assertEquals(
      (postLogoutRetrieveResult as { error: string }).error,
      "Invalid session token or credential type not found",
      "Retrieval should fail after logout",
    );
    console.log(
      `   Error received: ${(postLogoutRetrieveResult as { error: string }).error}. Credential inaccessible as expected.`,
    );

    console.log("Principle test complete: User authentication flow demonstrated successfully.");
  });

  await client.close();
});
```
