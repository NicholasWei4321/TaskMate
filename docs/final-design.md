# TaskMate Design Comparison

## Overview

This document compares the implemented TaskMate application against the original concept design from Assignment 2.

## Core Architectural Differences

### 1. **Concept Decomposition Philosophy**

**Original Design**: The original specification had four core concepts (`Task`, `Assigner`, `Priority`, `TodoList`), that were conceptually separate but operationally interdependent. `Priority` and `Assigner` only a single action, and it seemed better to incoroporate them into the `Task` concept.

**Actual Implementation**: TaskMate combines `Priority` and `Task` and also adds `UserAuthentication` and `ExternalAssignmentSync`. The `Requesting` concept is also used to prevent exposure in the frontend of actions that require authentication:
- `AIPrioritizedTask` - Combines Task and Priority functionality with AI enhancement
- `TodoList` - Time-scoped collections of generic items
- `ExternalAssignmentSync` - Replaces the implicit Assigner concept with explicit external platform integration (see difference #3).
- `UserAuthentication` - Session and credential management (not in original spec)
- `Requesting` - Request/response handling (infrastructure concept)

### 2. **Task vs. AIPrioritizedTask: Priority Integration**

**Original Design**: `Task` and `Priority` existed as separate concepts. Priority was computed externally based on a task's due date and overdue status, with the specification noting it "could incorporate percentage of grade, etc." in future versions.

**Implementation**: `AIPrioritizedTask` is a unified concept that:
- Internalizes priority calculation as a core task attribute
- Uses LLM inference to extract effort, importance, and difficulty from task descriptions
- Implements priority formula: `timeBasedScore + (importance × 50) + (difficulty × 30) + (1/effort × 100)`
- Falls back to time-based priority when LLM inference fails
- Stores `priorityScore` directly in the task document with metadata tracking (`lastPriorityCalculationTime`)

**Key Differences**:
- Priority is no longer a separate concept but an intrinsic task property
- AI-driven prioritization vs. simple date-based prioritization
- Automatic recalculation triggers (on task creation, update, snooze, overdue marking)
- User can manually override AI-inferred attributes while preserving the priority calculation logic

### 3. **Assigner vs. ExternalAssignmentSync: Source Management**

**Original Design**: `Assigner` represented a category or source of tasks (e.g., course, project, personal to-dos) with a simple interface for adding tasks. The concept was abstract and didn't specify external platform integration mechanics.

**Implementation**: `ExternalAssignmentSync` is a specialized concept for:
- **Connection management**: Storing and validating credentials for external platforms. I used only Canvas because it already has a usable API, unlike Gradescope.
- **Polling mechanism**: Fetching raw assignment data from external APIs
- **Change detection**: Identifying new or modified assignments via timestamp comparison
- **Bidirectional mapping**: Maintaining `externalId ↔ internalId` relationships
- **Error handling**: Explicit handling of invalid credentials, network errors, rate limits

**Key Differences**:
- Explicit external platform integration vs. abstract categorization
- Real API interactions (Canvas API validation/fetching) vs. conceptual task creation
- State tracking (`lastSuccessfulPoll`, `lastExternalModificationTimestamp`) for sync coordination
- Multiple source types with extensible connection details structure

### 4. **Syncs**

**Original Design**: Syncs were specified as simple sequential chains triggered by user requests:

```
sync integrateNewTask
  when Request.newTask(source: Assigner, name, description, dueDate)
  then Assigner.addTask(name, description, dueDate)

sync getTaskPriority
  when Request.newTask()
  when Assigner.addTask(): (Task)
  then Priority.getPriority(Task)
```

**Implementation**: Syncs follow a **3-phase authentication pattern** for protected routes:

1. **Authenticate**: Verify sessionToken → getCurrentUser
2. **Execute**: Use authenticated user → perform concept action
3. **Respond**: Send result/error back to frontend

**Key Differences**:
- Authentication is baked into nearly all sync chains (not present in original design)
- Explicit error handling syncs for each operation
- Bidirectional flow: request → action → response vs. unidirectional request → action
- No direct Priority concept syncs; priority calculation is internal to AIPrioritizedTask

## Implementation-Specific Features

### Not in Original Specification

1. **UserAuthentication Concept**
   - Session token management
   - Multi-credential storage (Canvas API keys, OAuth tokens)
   - Credential CRUD operations (store, retrieve, update, delete)

2. **AI-Enhanced Prioritization**
   - LLM integration (Gemini) for task attribute inference
   - Validation ranges (effort: 0.5-40 hours, importance/difficulty: 1-10)
   - Fallback mechanisms when AI inference fails

3. **Recurring Lists**
   - Daily, weekly, monthly recurrence types
   - Automatic list recreation with uncompleted item carryover
   - Due date adjustment for carried-over items

4. **Real External API Integration**
   - Canvas API client with rate limiting, error handling
   - Credential validation before source connection
   - Network error recovery and retry mechanisms

5. **System Actions**
   - `markOverdue` (auto-triggered for tasks past due date)
   - `calculateTaskPriority` (periodic recalculation)
   - `autoClearIfNeeded`, `recreateRecurringList` (TodoList lifecycle)

### Simplified from Original Specification

1. **No Explicit "Assigner" Queries**: The original design included queries like `getOverdue(user)` on TodoList to identify tasks past their due date. The implementation moves this logic into `AIPrioritizedTask.markOverdue` as a system action.

2. **Priority Updates**: The original design had `TodoList.updatePriority` to adjust task priorities within a list. The implementation handles this through task updates that trigger automatic priority recalculation.

3. **End-of-Day Syncs**: The original design specified explicit "end of day" workflows (`endOfDayClear`, `updateOverDue`). The implementation handles these through recurring list processing and system-triggered `markOverdue` actions.

## Visual Design Differences

The visual design of TaskMate stayed similar to that of Assignment 4b. However, a few new popups were created, including a connection success for syncing assignments from Canvas, as well as popup errors for invalid credentials or duplicate task/list names.