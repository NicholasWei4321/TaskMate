# TaskMate - Application Design Document

## Overview

TaskMate is an AI-enhanced task management application that combines time-based urgency with AI-inferred task attributes for intelligent prioritization.

**Core Concepts**:
- **[AIPrioritizedTask](concepts/AIPrioritizedTask/AIPrioritizedTask.md)** - Task management with AI-powered priority calculation
- **[TodoList](concepts/TodoList/TodoList.md)** - Organize tasks into named collections
- **[UserAuthentication](concepts/UserAuthentication/UserAuthentication.md)** - User auth and credential storage
- **[ExternalAssignmentSync](concepts/ExternalAssignmentSync/ExternalAssignmentSync.md)** - Import and sync assignments from external platforms (Canvas, GitHub, etc.)



## Interesting Moments

### Moment 1: Context Tool Generated Placeholder LLM Implementation

**Context**: [Initial AIPrioritizedTask Implementation](../context/design/concepts/AIPrioritizedTask/implementation.md/steps/response.b719b45c.md)

**What Happened**: When the Context tool generated the TypeScript implementation for AIPrioritizedTask, it created a placeholder `_triggerLLMInference` function that returned mock values instead of actually calling the Gemini API. It was interesting that the Context tool couldn't create the code to call the Gemini API but was able to create a temporary placeholder.

**Solution**: Manually integrated the real LLM calling code from Assignment 3 and updated priority calculation weights to match specification.

### Moment 2: Context-Generated Tests Required Manual Corrections

**Context**: [Context-generated Initial Test Cases](../context/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts/20251007_212001.aacd419f.md)

**What Happened**: Context tool generated tests using nested `t.step()` calls within a single `Deno.test()`, but assignment required separate `Deno.test()` calls for each test case, and also some test cases had bugs.

**Challenge**: Generated tests had three bugs: (1) all tests nested in substeps instead of separate, (2) `markOverdue` test incorrectly assumed priority must increase (already high for past dates), (3) `calculateTaskPriority` test compared priority values (could be same if LLM returns identical results), (4) query tests had shared database state conflicts.

**Solution**: Manually separated into 19 independent `Deno.test()` calls. Fixed `markOverdue` to verify overdue flag change and non-zero priority. Fixed `calculateTaskPriority` to compare `lastPriorityCalculationTime` timestamps. Fixed query tests to use unique test users.



### Moment 3: Spec Ambiguity During Implementation Review

**Context**: [Initial Implementation](../context/design/concepts/TodoList/implementation.md/steps/file.3147a341.md)

**What Happened**: After askign Context to implement the spec, realized `recreateRecurringList` specification was ambiguous, "new startTime is list.endTime + 1 day, new endTime is list.endTime + 1 day" literally meant both times are identical, creating zero-duration lists.

**Solution**: Revised Spec now unambiguous with duration formula documented. All 7 actions (including new markItemCompleted) properly implemented.


### Moment 4: Context-Generated Implementation Included Error Handling Missing from Spec

**Context**: [Additional Error Handling in Initial Implementation](../context/design/concepts/TodoList/implementation.md/steps/file.3147a341.md)

**What Happened**: Context generated TodoList implementation with comprehensive error handling for all actions, but the specification only documented error signatures for `createList`. Had to decide whether to remove error handling from code or add it to spec.

**Solution**: Added error action sections to specification for all 7 actions and 3 queries, documenting when each returns error messages versus success values. (Added at end of spec for clarity)


### Moment 5: Context-Generated TodoList Tests Had Missing Edge Cases

**Context**: [Initial Test Cases](../context/design/concepts/TodoList/testing.md/steps/file.563499c9.md)

**What Happened**: Context generated nested `test.step()` test cases again, just like before, which seems to indicate that Context is unaware of the fact that it needs to produce multiple Deno.test cases. Was also missing a few edge cases, eg. all items completed, weekly/monthly occurence, etc.

**Solution**: Rewrite to separate `Deno.test()` calls. Added missing edge case tests.



### Moment 6: Context Created Password Utility Instead of Separate Concept

**Context**: [Password Implementation](../context/src/utils/password.ts/20251023_235144.fc7fd8c8.md)

**What Happened**: When implementing UserAuthentication, Context generated password hashing/comparison functions as a utility module (`src/utils/password.ts`) rather than as a separate Password concept.

**Decision**: Kept the utility approach. Password hashing is stateless transformation logic (hash input → output), not a concept with independent state and operational principle. It's appropriately abstracted as a utility used by UserAuthentication.

**Lessons Learned**: Not everything needs to be a concept. Security utilities like password hashing are implementation details that support concepts without being concepts themselves.



### Moment 7: Context Suggested Non-Existent bcrypt Module Version

**Context**: [Initial Implementation](../context/design/concepts/UserAuthentication/implementation.md/steps/file.6618ede0.md)

**What Happened**: Context's implementation.md suggested importing `https://deno.land/x/bcrypt@v1.1.0/mod.ts` for password hashing, but this version doesn't exist. Running tests caused "Cannot find module" error.

**Solution**: After searching around, switched to `npm:bcryptjs@2.4.3` (pure JavaScript bcrypt implementation) instead of native bcrypt. Added to deno.json import map and updated password.ts to use bcryptjs API.



### Moment 8: Context Generated Placeholder External API Implementation

**Context**: [Placeholder Implementation](../context/design/concepts/ExternalAssignmentSync/implementation.md/steps/response.e9804296.md)

**What Happened**: When implementing ExternalAssignmentSync, Context initially generated `pollExternalSource` with hardcoded mock assignment data rather than actual external API calls. Similar to the LLM placeholder in Moment 1, Context created a skeleton implementation but couldn't integrate with real external APIs.

**Decision**: I decided to implement real Canvas API integration only for now. Since Github, Catsoop, Gradescope, etc. all have different APIs, authentication methods, and data structures, it would be really difficult to create a generic implementation. For now, using Canvas integration shows that the ExternalAssignmentSync concept works correctly.

**Solution**: Created dedicated `canvas-api.ts` utility with functions to validate credentials, fetch courses, and fetch assignments from Canvas LMS. Replaced mock data in `pollExternalSource` with real Canvas API calls that convert Canvas assignment format to the concept's internal `ExternalAssignmentDetails` structure.


### Moment 9: Canvas API Returned Too Many Old Assignments

**Context**: [Initial Canvas API Implementation](../context/src/concepts/ExternalAssignmentSync/canvas-api.ts/20251023_211528.c2889971.md)

**What Happened**: First test fetched 69 assignments including 2021-2023 courses. Canvas returns all historical courses/assignments by default.

**Solution**: Added two-level filtering: (1) `enrollment_state=active` for current courses only, (2) date filter for assignments from last 6 months or with future due dates.


## Backend Implementation Updates

### Recurring List Auto-Recreation System

**Implementation**: Added automatic recurring list recreation system to TodoList concept to handle daily/weekly/monthly to-do lists.

**Changes**:
- Added `processRecurringLists()` helper method that:
  - Finds all expired recurring lists (where `endTime < current time`)
  - Checks if successor list already exists (prevents duplicates on page refresh)
  - Auto-clears completed items if `autoClearCompleted` is enabled
  - Calls `recreateRecurringList()` to create new list for next period
- Integrated into `getListsForUser()` and `getActiveListsForUser()` queries to automatically process on every fetch
- Fixed time calculation bug: Changed from `newStartTime = oldEndTime + 1 period` to `newStartTime = oldStartTime + 1 period` for continuous coverage

**Rationale**: The `recreateRecurringList()` and `autoClearIfNeeded()` system actions existed but were never called. Without automated triggering, daily lists would expire and never refresh.

### Default List Deletion Protection

**Implementation**: Added protection to prevent deletion of default system lists.

**Changes**:
- Modified `deleteList()` action in TodoList concept to check list name before deletion
- Rejects deletion attempts for "Daily To-dos", "Weekly To-dos", or "Monthly To-dos"
- Returns error: `Cannot delete default system list '${listName}'`

**Rationale**: Default recurring lists are essential system functionality and should not be deletable by users.

### Task List Association Fix

**Implementation**: Fixed "Create Task" button on Dashboard to properly associate tasks with custom lists.

**Changes**:
- Updated `handleCreateTask()` in Dashboard to support multi-list selection
- Modified task creation flow to:
  - Auto-add tasks to Daily/Weekly/Monthly lists based on due date matching list time ranges
  - Add tasks to user-selected custom lists
  - Refresh lists after task creation to show new items immediately
- Frontend: Added checkbox list for custom list selection in Create Task modal

**Rationale**: Tasks were created but not automatically added to their time-appropriate default lists, breaking the core list management functionality.

### Edit Task List Management

**Implementation**: Added ability to manage task-list associations when editing tasks.

**Changes**:
- Updated Edit Task modal to show checkboxes for custom lists
- Pre-populates checkboxes with lists currently containing the task
- On save, calculates diff between original and new list selections:
  - Adds task to newly selected lists via `addListItem()`
  - Removes task from deselected lists via `removeListItem()`
- Refreshes list data after updates

**Rationale**: Users needed ability to reorganize tasks across custom lists after creation.