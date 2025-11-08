# TaskMate Route Configuration

This document outlines which concept actions should be **included** (passthrough) vs **excluded** (handled by syncs or backend-only).

## Exclusion Reasons

1. **Authentication Required**: Actions that need session verification
2. **Backend-Only**: System actions that frontend should never call directly

## UserAuthentication Concept

| Action | Type | Reason |
|--------|------|--------|
| `register` | **INCLUDE** | Public - anyone can register |
| `login` | **INCLUDE** | Public - anyone can login |
| `logout` | **EXCLUDE** | Requires auth - need session token |
| `getCurrentUser` | **EXCLUDE** | Requires auth - used internally by syncs |
| `storeCredential` | **EXCLUDE** | Requires auth - needs session token |
| `retrieveCredential` | **EXCLUDE** | Requires auth - needs session token |
| `updateCredential` | **EXCLUDE** | Requires auth - needs session token |
| `deleteCredential` | **EXCLUDE** | Requires auth - needs session token |
| `getCredentialTypes` | **EXCLUDE** | Requires auth - needs session token |

## AIPrioritizedTask Concept

| Action | Type | Reason |
|--------|------|--------|
| `createTask` | **EXCLUDE** | Requires auth - handled by sync |
| `updateTask` | **EXCLUDE** | Requires auth - handled by sync |
| `snoozeTask` | **EXCLUDE** | Requires auth - need to verify task ownership |
| `completeTask` | **EXCLUDE** | Requires auth - need to verify task ownership |
| `getTask` | **EXCLUDE** | Requires auth - need to verify task ownership |
| `getTasksByOwner` | **EXCLUDE** | Requires auth - handled by sync |
| `getPrioritizedTasks` | **EXCLUDE** | Requires auth - handled by sync |
| `markOverdue` | **BACKEND-ONLY** | System action, not called by frontend |
| `calculateTaskPriority` | **BACKEND-ONLY** | System action, not called by frontend |

## TodoList Concept

| Action | Type | Reason |
|--------|------|--------|
| `createList` | **EXCLUDE** | Requires auth - handled by sync |
| `deleteList` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `addListItem` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `removeListItem` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `markItemCompleted` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `clearCompletedItems` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `updateList` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `updateListSettings` | **EXCLUDE** | Requires auth - need to verify list ownership |
| `getListsForUser` | **EXCLUDE** | Requires auth - handled by sync |
| `getListByName` | **EXCLUDE** | Requires auth - need to verify user ownership |
| `getActiveListsForUser` | **EXCLUDE** | Requires auth - need to verify user ownership |
| `processRecurringLists` | **BACKEND-ONLY** | System action, called automatically |
| `autoClearIfNeeded` | **BACKEND-ONLY** | System action, called by processRecurringLists |
| `recreateRecurringList` | **BACKEND-ONLY** | System action, called by processRecurringLists |

## ExternalAssignmentSync Concept

| Action | Type | Reason |
|--------|------|--------|
| `connectSource` | **EXCLUDE** | Requires auth - need user session |
| `disconnectSource` | **EXCLUDE** | Requires auth - need user session |
| `pollExternalSource` | **EXCLUDE** | Requires auth - need user session |
| `identifyChanges` | **BACKEND-ONLY** | System action, not called directly |
| `recordInternalSync` | **BACKEND-ONLY** | System action, not called directly |

## Requesting Concept

| Action | Type | Reason |
|--------|------|--------|
| `request` | **BACKEND-ONLY** | Core sync engine action |
| `respond` | **BACKEND-ONLY** | Core sync engine action |

## Summary

### Include (Passthrough) - Public routes
- `UserAuthentication.register`
- `UserAuthentication.login`

### Exclude (Via Syncs) - Authentication required
All other user-facing actions require authentication and should go through the sync engine.

### Backend-Only - Never exposed
- System/cron actions: `markOverdue`, `calculateTaskPriority`, `processRecurringLists`, `autoClearIfNeeded`, `recreateRecurringList`
- Internal sync actions: `identifyChanges`, `recordInternalSync`
- Sync engine core: `request`, `respond`
