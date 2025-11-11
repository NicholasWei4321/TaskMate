# TaskMate Route Status - Actual Implementation

Based on backend server logs, here's exactly what's happening:

## ✅ INCLUDED Routes (Passthrough - Direct Access)

These routes are verified and shown with `->` in the logs:

```
  -> /api/UserAuthentication/register
  -> /api/UserAuthentication/login
```

**Why included**: Public authentication endpoints - anyone can register/login without a session token.

---

## ❌ EXCLUDED Routes (Via Sync Engine - Authentication Required)

These routes are **excluded from passthrough** and handled via synchronizations. Notice they do NOT appear in the "WARNING - UNVERIFIED ROUTE" list:

```
  /api/AIPrioritizedTask/createTask
  /api/AIPrioritizedTask/updateTask
  /api/AIPrioritizedTask/getPrioritizedTasks
  /api/TodoList/createList
  /api/TodoList/getListsForUser
```

**Why excluded**: These require authentication. The sync engine verifies the session token before executing the action.

### How Excluded Routes Work

Example from logs - `getListsForUser`:
```
1. [Requesting] Received request for path: /TodoList/getListsForUser
2. Requesting.request fires with sessionToken
3. UserAuthentication.getCurrentUser verifies session
4. TodoList.getListsForUser executes with authenticated user
5. Requesting.respond sends result back
```

---

## ⚠️ UNVERIFIED Routes (Passthrough - Temporary)

These routes appear as `WARNING - UNVERIFIED ROUTE` in the logs. They use passthrough for demo purposes:

### UserAuthentication (Session-based operations)
- `/api/UserAuthentication/logout`
- `/api/UserAuthentication/getCurrentUser`
- `/api/UserAuthentication/storeCredential`
- `/api/UserAuthentication/retrieveCredential`
- `/api/UserAuthentication/updateCredential`
- `/api/UserAuthentication/deleteCredential`
- `/api/UserAuthentication/getCredentialTypes`

### AIPrioritizedTask (Other task operations)
- `/api/AIPrioritizedTask/snoozeTask`
- `/api/AIPrioritizedTask/completeTask`
- `/api/AIPrioritizedTask/getTask`
- `/api/AIPrioritizedTask/getTasksByOwner`

### TodoList (Other list operations)
- `/api/TodoList/addListItem`
- `/api/TodoList/removeListItem`
- `/api/TodoList/deleteList`
- `/api/TodoList/markItemCompleted`
- `/api/TodoList/clearCompletedItems`
- `/api/TodoList/updateList`
- `/api/TodoList/updateListSettings`
- `/api/TodoList/getListByName`
- `/api/TodoList/getActiveListsForUser`

### ExternalAssignmentSync
- `/api/ExternalAssignmentSync/connectSource`
- `/api/ExternalAssignmentSync/disconnectSource`
- `/api/ExternalAssignmentSync/pollExternalSource`

**Why unverified**: These should have authentication syncs in production, but use passthrough temporarily for demo functionality. The frontend's axios interceptor includes sessionToken in all requests, so they're still authenticated at the concept level.

---

## 🔒 Backend-Only (Never Exposed)

These routes **should be** in the warnings but are not because they're private methods (start with `_`) or system-only:

### Private/Helper Methods (underscore prefix)
- `_triggerLLMInference`
- `_createAttributePrompt`
- `_validateInferredAttributes`
- `_calculateTimeBasedPriority`
- `_calculateAIPriority`
- `_recalculateAndSavePriority`
- `_getSourcesForUser`
- `_getMappedInternalId`
- `_getAssignmentsForSource`

### System Actions (called internally)
- `markOverdue` - Called by system when tasks become overdue
- `calculateTaskPriority` - Called internally after task creation/updates
- `processRecurringLists` - Called by system to manage recurring lists
- `autoClearIfNeeded` - Called by processRecurringLists
- `recreateRecurringList` - Called by processRecurringLists
- `hasDefaultDates` - Helper method
- `identifyChanges` - Called internally by sync process
- `recordInternalSync` - Called internally by sync process

---

## Summary Statistics

- **2 routes** explicitly INCLUDED (public auth)
- **5 routes** explicitly EXCLUDED (handled by syncs)
- **~30 routes** UNVERIFIED (passthrough temporarily)
- **~15 routes** BACKEND-ONLY (private/system methods)

## Production Recommendation

In a production system, all the "UNVERIFIED" routes should either:
1. Have authentication syncs (for user-facing operations)
2. Be moved to INCLUDED with justification (if truly public)
3. Stay as WARNING if they're meant to be internal-only

For this assignment demo, we've implemented auth syncs for the 5 most critical operations to demonstrate the pattern.
