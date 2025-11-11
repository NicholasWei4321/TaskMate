# Route Configuration Decision - No Temporary Passthroughs

Let's categorize every unverified route as either INCLUDED or EXCLUDED.

## Decision Criteria

**INCLUDE** if:
- Action is truly public (no user context needed)
- Action is a read-only query that anyone can access

**EXCLUDE** if:
- Action requires authentication (needs sessionToken)
- Action modifies user data (needs to verify ownership)
- Action reads user-specific data (needs to verify user identity)

---

## UserAuthentication Routes

| Route | Decision | Reason |
|-------|----------|--------|
| `logout` | **EXCLUDE** | Requires sessionToken to know which session to end |
| `getCurrentUser` | **EXCLUDE** | Requires sessionToken to identify user (used internally by syncs) |
| `storeCredential` | **EXCLUDE** | Modifies user data, requires sessionToken |
| `retrieveCredential` | **EXCLUDE** | Reads user data, requires sessionToken |
| `updateCredential` | **EXCLUDE** | Modifies user data, requires sessionToken |
| `deleteCredential` | **EXCLUDE** | Modifies user data, requires sessionToken |
| `getCredentialTypes` | **EXCLUDE** | Reads user-specific data, requires sessionToken |

**Result**: All 7 should be EXCLUDED

---

## AIPrioritizedTask Routes

| Route | Decision | Reason |
|-------|----------|--------|
| `snoozeTask` | **EXCLUDE** | Modifies task, must verify user owns it |
| `completeTask` | **EXCLUDE** | Modifies task, must verify user owns it |
| `getTask` | **EXCLUDE** | Reads task, must verify user owns it |
| `getTasksByOwner` | **EXCLUDE** | Reads user's tasks, requires auth |
| `markOverdue` | **EXCLUDE** | System action, should never be called by frontend |
| `calculateTaskPriority` | **EXCLUDE** | System action, should never be called by frontend |

**Already excluded**: createTask, updateTask, getPrioritizedTasks

**Result**: All 6 additional task routes should be EXCLUDED

---

## TodoList Routes

| Route | Decision | Reason |
|-------|----------|--------|
| `addListItem` | **EXCLUDE** | Modifies list, must verify user owns it |
| `removeListItem` | **EXCLUDE** | Modifies list, must verify user owns it |
| `deleteList` | **EXCLUDE** | Deletes list, must verify user owns it |
| `markItemCompleted` | **EXCLUDE** | Modifies list, must verify user owns it |
| `clearCompletedItems` | **EXCLUDE** | Modifies list, must verify user owns it |
| `updateList` | **EXCLUDE** | Modifies list, must verify user owns it |
| `updateListSettings` | **EXCLUDE** | Modifies list, must verify user owns it |
| `getListByName` | **EXCLUDE** | Reads user's list, requires auth |
| `getActiveListsForUser` | **EXCLUDE** | Reads user's lists, requires auth |
| `processRecurringLists` | **EXCLUDE** | System action, called automatically |
| `autoClearIfNeeded` | **EXCLUDE** | System action, helper for processRecurringLists |
| `recreateRecurringList` | **EXCLUDE** | System action, helper for processRecurringLists |
| `hasDefaultDates` | **EXCLUDE** | Helper method, not meant for direct frontend calls |

**Already excluded**: createList, getListsForUser

**Result**: All 11 additional list routes should be EXCLUDED

---

## ExternalAssignmentSync Routes

| Route | Decision | Reason |
|-------|----------|--------|
| `connectSource` | **EXCLUDE** | Creates user's sync connection, requires auth |
| `disconnectSource` | **EXCLUDE** | Removes user's sync connection, requires auth |
| `pollExternalSource` | **EXCLUDE** | Polls user's external source, requires auth |
| `identifyChanges` | **EXCLUDE** | System action, called internally by pollExternalSource |
| `recordInternalSync` | **EXCLUDE** | System action, called internally |

**Result**: All 5 sync routes should be EXCLUDED

---

## Private/Helper Methods (underscore prefix)

These are already hidden by Requesting concept (they start with `_`):
- `_triggerLLMInference`
- `_createAttributePrompt`
- `_validateInferredAttributes`
- `_calculateTimeBasedPriority`
- `_calculateAIPriority`
- `_recalculateAndSavePriority`
- `_getSourcesForUser`
- `_getMappedInternalId`
- `_getAssignmentsForSource`

**Result**: No action needed - already private

---

## Final Count

**INCLUDED**: 2 routes (register, login)
**EXCLUDED**: 34 routes total
  - 5 already excluded (createTask, updateTask, getPrioritizedTasks, createList, getListsForUser)
  - 29 NEW exclusions:
    - 7 UserAuthentication
    - 6 AIPrioritizedTask
    - 11 TodoList
    - 5 ExternalAssignmentSync

**Private**: ~10 routes (already hidden)

---

## Implementation Plan

1. Update `passthrough.ts` to exclude all 34 routes
2. Create authentication syncs for the 29 routes we use (exclude system actions from syncs)
3. System actions (markOverdue, calculateTaskPriority, etc.) will be excluded but won't have syncs - they're only called internally

**Note**: We don't need to create syncs for system actions like `markOverdue` because:
- They're excluded from passthrough (frontend can't call them)
- They're only called by backend code internally
- No HTTP request will ever trigger them
