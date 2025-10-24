UserAuthenticationConcept.test.ts
Action: register - successful registration ...
------- post-test output -------
--- Test: register - successful registration ---
Attempting to register user: testuser1
Registered user with ID: 019a1390-83e4-71df-948e-0c57f46b31ad
State verified: user document created successfully.
----- post-test output end -----
Action: register - successful registration ... ok (937ms)
Action: register - username already taken ...
------- post-test output -------
--- Test: register - username already taken ---
Registering initial user: testuser2
Initial user registered with ID: 019a1390-866c-7029-88a8-eaffcc34e09d
Attempting to register user with duplicate username: testuser2
Error received: Username already taken
State verified: no new user created for duplicate username.
----- post-test output end -----
Action: register - username already taken ... ok (836ms)
Action: login - successful login ...
------- post-test output -------
--- Test: login - successful login ---
Registered user testuser3 with ID: 019a1390-8a32-79f6-a72c-9ef54d48f000
Attempting to login user: testuser3
Logged in successfully, session token: 019a1390-8aaf-75f3-9299-04021444f84f
State verified: active session created.
----- post-test output end -----
Action: login - successful login ... ok (898ms)
Action: login - invalid username or password ...
------- post-test output -------
--- Test: login - invalid username or password ---
Attempting to login with invalid credentials for user: testuser4
Error received: Invalid username or password
State verified: no active session created.
----- post-test output end -----
Action: login - invalid username or password ... ok (555ms)
Action: login - wrong password for existing user ...
------- post-test output -------
--- Test: login - wrong password for existing user ---
Registering user: testuser5
Attempting to login with wrong password for existing user: testuser5
Error received: Invalid username or password
State verified: no active session created for wrong password.
----- post-test output end -----
Action: login - wrong password for existing user ... ok (853ms)
Action: logout - successful logout ...
------- post-test output -------
--- Test: logout - successful logout ---
Logged in user testuser6, session token: 019a1390-937f-7fe4-93fe-7dcbf2f3ec93
Attempting to logout with session token: 019a1390-937f-7fe4-93fe-7dcbf2f3ec93
Logout successful.
State verified: active session removed.
----- post-test output end -----
Action: logout - successful logout ... ok (839ms)
Action: logout - invalid session token ...
------- post-test output -------
--- Test: logout - invalid session token ---
Attempting to logout with invalid session token: nonexistent_token
Error received: Invalid session token
State verified: no change to active sessions.
----- post-test output end -----
Action: logout - invalid session token ... ok (566ms)
Action: getCurrentUser - successful retrieval ...
------- post-test output -------
--- Test: getCurrentUser - successful retrieval ---
Logged in user testuser7 (ID: 019a1390-985b-7e65-a04d-4049562497e1), session token: 019a1390-98d8-7574-982a-8242accca0ff
Attempting to get current user for session token: 019a1390-98d8-7574-982a-8242accca0ff
Retrieved user ID: 019a1390-985b-7e65-a04d-4049562497e1
----- post-test output end -----
Action: getCurrentUser - successful retrieval ... ok (782ms)
Action: getCurrentUser - invalid session token ...
------- post-test output -------
--- Test: getCurrentUser - invalid session token ---
Attempting to get current user for invalid session token: unknown_session
Error received: Invalid session token
----- post-test output end -----
Action: getCurrentUser - invalid session token ... ok (549ms)
Action: storeCredential - successful storage ...
------- post-test output -------
--- Test: storeCredential - successful storage ---
Logged in user testuser8 (ID: 019a1390-9dc3-72ae-a53c-f40b65152b0b), session token: 019a1390-9e40-78c8-8fd2-e2edfb370a25
Storing credential type 'GitHub' for user.
Credential stored successfully.
State verified: credential stored in user document.
----- post-test output end -----
Action: storeCredential - successful storage ... ok (897ms)
Action: storeCredential - invalid session token ...
------- post-test output -------
--- Test: storeCredential - invalid session token ---
Attempting to store credential with invalid session token: bad_session
Error received: Invalid session token
----- post-test output end -----
Action: storeCredential - invalid session token ... ok (543ms)
Action: storeCredential - empty credential type ...
------- post-test output -------
--- Test: storeCredential - empty credential type ---
Logged in user testuser9, session token: 019a1390-a402-7d89-b287-31550300d05d
Attempting to store credential with empty credential type.
Error received: Credential type cannot be empty
----- post-test output end -----
Action: storeCredential - empty credential type ... ok (866ms)
Action: retrieveCredential - successful retrieval ...
------- post-test output -------
--- Test: retrieveCredential - successful retrieval ---
Logged in user testuser10 (ID: 019a1390-a66b-70e9-bc90-7877106d78f4), session token: 019a1390-a6e0-7f8a-8fa0-cb35f2423543. Credential stored.
Retrieving credential type 'Slack'.
Retrieved credential: xoxb-12345
----- post-test output end -----
Action: retrieveCredential - successful retrieval ... ok (780ms)
Action: retrieveCredential - invalid session token ...
------- post-test output -------
--- Test: retrieveCredential - invalid session token ---
Attempting to retrieve credential with invalid session token: bad_session_for_retrieve
Error received: Invalid session token or credential type not found
----- post-test output end -----
Action: retrieveCredential - invalid session token ... ok (577ms)
Action: retrieveCredential - credential type not found ...
------- post-test output -------
--- Test: retrieveCredential - credential type not found ---
Logged in user testuser11, session token: 019a1390-ac20-7663-a3ad-d54420c2e8c7. Stored 'Confluence'.
Attempting to retrieve non-existent credential type: 'Asana'.
Error received: Invalid session token or credential type not found
----- post-test output end -----
Action: retrieveCredential - credential type not found ... ok (772ms)
Action: updateCredential - successful update ...
------- post-test output -------
--- Test: updateCredential - successful update ---
Logged in user testuser12 (ID: 019a1390-aeda-7e9d-a6f0-5e70d55bb544), session token: 019a1390-af52-7714-9de4-730e04ddaadd. Stored 'Azure' with value 'az_old_token'.
Updating credential type 'Azure' to new value.
Credential updated successfully.
State verified: credential value updated.
----- post-test output end -----
Action: updateCredential - successful update ... ok (864ms)
Action: updateCredential - credential type not found ...
------- post-test output -------
--- Test: updateCredential - credential type not found ---
Logged in user testuser13, session token: 019a1390-b327-7943-903d-e86b08a69a83.
Attempting to update non-existent credential type: 'NonexistentCred'.
Error received: Credential type not found for this user
----- post-test output end -----
Action: updateCredential - credential type not found ... ok (891ms)
Action: updateCredential - invalid session token ...
------- post-test output -------
--- Test: updateCredential - invalid session token ---
Attempting to update credential with invalid session token: bad_session_for_update
Error received: Invalid session token
----- post-test output end -----
Action: updateCredential - invalid session token ... ok (525ms)
Action: updateCredential - empty credential type ...
------- post-test output -------
--- Test: updateCredential - empty credential type ---
Logged in user testuser14, session token: 019a1390-b80d-76e2-8494-e917c7e84b32.
Attempting to update credential with empty credential type.
Error received: Credential type cannot be empty
----- post-test output end -----
Action: updateCredential - empty credential type ... ok (716ms)
Action: deleteCredential - successful deletion ...
------- post-test output -------
--- Test: deleteCredential - successful deletion ---
Logged in user testuser15 (ID: 019a1390-ba98-7c01-a8fa-e8387f42ce5e), session token: 019a1390-bb0d-7213-a2e1-ff94e6b47942. Stored 'Google'.
Deleting credential type: 'Google'.
Credential deleted successfully.
State verified: credential removed from user document.
----- post-test output end -----
Action: deleteCredential - successful deletion ... ok (872ms)
Action: deleteCredential - credential type not found ...
------- post-test output -------
--- Test: deleteCredential - credential type not found ---
Logged in user testuser16, session token: 019a1390-be87-7853-b5ec-96043f40dcdc.
Attempting to delete non-existent credential type: 'MissingCred'.
Error received: Invalid session token or credential type not found
----- post-test output end -----
Action: deleteCredential - credential type not found ... ok (822ms)
Action: getCredentialTypes - successful retrieval ...
------- post-test output -------
--- Test: getCredentialTypes - successful retrieval ---
Logged in user testuser17, session token: 019a1390-c218-77b5-9dc5-8e2641aca352. Stored 'Zoom' and 'Trello'.
Retrieving all credential types.
Retrieved types: Trello, Zoom
----- post-test output end -----
Action: getCredentialTypes - successful retrieval ... ok (997ms)
Action: getCredentialTypes - invalid session token ...
------- post-test output -------
--- Test: getCredentialTypes - invalid session token ---
Attempting to get credential types with invalid session token: bad_session_for_gettypes
Error received: Invalid session token
----- post-test output end -----
Action: getCredentialTypes - invalid session token ... ok (604ms)
Principle: User Authentication Flow ...
------- post-test output -------
--- Principle Test: User Authentication Flow ---
1. Register a new user.
   User 'testuser18' registered with ID: 019a1390-c7a3-774c-b6e5-510c2530e55d
2. Login with the registered user.
   Logged in successfully, session token: 019a1390-c820-782f-b69e-f07090aea4c6
3. Store a credential while logged in.
   Credential 'Dropbox' stored.
4. Retrieve the credential while logged in.
   Retrieved credential: dbx_token_123
5. Logout the user.
   User logged out.
6. Attempt to retrieve credential after logging out (should fail).
   Error received: Invalid session token or credential type not found. Credential inaccessible as expected.
Principle test complete: User authentication flow demonstrated successfully.
----- post-test output end -----
Principle: User Authentication Flow ... ok (918ms)