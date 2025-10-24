# ExternalAssignmentSync Test Output

```
running 9 tests from ./src/concepts/ExternalAssignmentSync/ExternalAssignmentSyncConcept.test.ts
ExternalAssignmentSync - connectSource with invalid credentials ...
------- output -------
✓ Invalid credentials rejected
----- output end -----
ExternalAssignmentSync - connectSource with invalid credentials ... ok (748ms)

ExternalAssignmentSync - connectSource duplicate source name ...
------- output -------
✓ First connection succeeded: 019a13f6-ae1e-779f-8409-b6a6e1baec11
✓ Duplicate source name rejected
----- output end -----
ExternalAssignmentSync - connectSource duplicate source name ... ok (921ms)

ExternalAssignmentSync - connectSource and pollExternalSource with real Canvas ...
------- output -------
✓ Connected to Canvas: 019a13f6-b180-7a15-92ab-c08b080f6f6b
✓ Source stored in database
✓ Fetched 85 assignments from Canvas
✓ Assignment structure valid: Assignment 1: Problem Framing
✓ Cleanup successful
----- output end -----
ExternalAssignmentSync - connectSource and pollExternalSource with real Canvas ... ok (5s)

ExternalAssignmentSync - identifyChanges detects new assignments ...
------- output -------
✓ Identified 85 new assignments
----- output end -----
ExternalAssignmentSync - identifyChanges detects new assignments ... ok (7s)

ExternalAssignmentSync - recordInternalSync and change detection ...
------- output -------
✓ Recorded sync for assignment 428696
✓ Mapping verified
✓ Unchanged assignment correctly excluded
----- output end -----
ExternalAssignmentSync - recordInternalSync and change detection ... ok (12s)

ExternalAssignmentSync - disconnectSource removes all mappings ...
------- output -------
✓ Recorded 2 syncs
✓ Mappings verified
✓ Source disconnected
✓ Source removed from database
✓ Mappings deleted (source not found)
----- output end -----
ExternalAssignmentSync - disconnectSource removes all mappings ... ok (5s)

ExternalAssignmentSync - query errors ...
------- output -------
✓ _getMappedInternalId returns error for non-existent mapping
✓ _getAssignmentsForSource returns error for non-existent source
✓ disconnectSource returns error for non-existent source
----- output end -----
ExternalAssignmentSync - query errors ... ok (636ms)

ExternalAssignmentSync - full workflow (principle trace) ...
------- output -------

=== Full Workflow Test ===

1. Connecting to Canvas...
   ✓ Connected: 019a13f7-2e79-7d1c-afdb-109ba2380120

2. Polling assignments...
   ✓ Fetched 85 assignments

3. Identifying changes...
   ✓ Identified 85 new assignments

4. Recording syncs...
   ✓ Recorded 3 syncs

5. Polling again...
   ✓ 82 assignments to process (new/updated only)

6. Verifying mappings...
   ✓ 3 mappings stored

7. Disconnecting...
   ✓ Disconnected

8. Verifying cleanup...
   ✓ All data cleaned up

=== Full Workflow Completed Successfully ===

----- output end -----
ExternalAssignmentSync - full workflow (principle trace) ... ok (14s)

ExternalAssignmentSync - multiple users and sources ...
------- output -------
✓ Multiple users can connect to same Canvas instance
✓ Same user can have multiple sources with different names
✓ Sources correctly isolated by user
----- output end -----
ExternalAssignmentSync - multiple users and sources ... ok (1s)

ok | 9 passed | 0 failed (49s)
```
