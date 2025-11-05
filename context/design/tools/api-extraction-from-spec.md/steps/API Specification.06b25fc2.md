---
timestamp: 'Mon Nov 03 2025 15:20:34 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251103_152034.67a611ce.md]]'
content_id: 06b25fc282a3e82bc12ca1b4ab8d184d1ed0f1266aad476eb279e4d2f8338342
---

# API Specification: AIPrioritizedTask Concept

**Purpose:** Compute personalized priority scores using LLM-inferred task attributes while preserving all original Task functionality

***

## API Endpoints

### POST /api/AIPrioritizedTask/createTask

**Description:** Creates a new task with the specified details, triggering an initial AI-enhanced priority calculation.

**Requirements:**

* `name` is non-empty and unique for the `owner`.
* `dueDate` is valid.

**Effects:**

* A new task is created with the provided owner, name, description, and due date.
* The task is initially marked as incomplete and not overdue.
* All AI-inferred attributes start as null.
* The priority score is set to an initial time-based value (higher for tasks with closer due dates).
* The system automatically triggers an AI-enhanced priority calculation for the new task and returns it.

**Request Body:**

```json
{
  "owner": "string",
  "name": "string",
  "description": "string",
  "dueDate": "string"
}
```

**Success Response Body (Action):**

```json
{
  "task": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/updateTask

**Description:** Updates existing properties of a task and recalculates its priority.

**Requirements:**

* `task` exists.
* If `newName` is provided, it is non-empty and unique for `task.owner` (excluding the current `task`).
* If `newDueDate` is provided, it is valid.

**Effects:**

* The task's properties are updated with any provided new values.
* If the name is provided, the task's name is changed.
* If the description is provided, it is updated.
* If a new due date is provided, the task's due date is changed and the overdue flag is reset.
* After any updates, the system recalculates the task's priority and returns the updated task.

**Request Body:**

```json
{
  "task": "string",
  "newName": "string | null",
  "newDescription": "string | null",
  "newDueDate": "string | null"
}
```

**Success Response Body (Action):**

```json
{
  "task": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/snoozeTask

**Description:** Updates a task's due date to a future time, resetting its overdue status and recalculating priority.

**Requirements:**

* `task` exists.
* `newDueDate` is in the future relative to the current time.

**Effects:**

* The task's due date is updated to the new date.
* The overdue flag is reset to false.
* The system recalculates the task's priority to reflect the new deadline and returns the updated task.

**Request Body:**

```json
{
  "task": "string",
  "newDueDate": "string"
}
```

**Success Response Body (Action):**

```json
{
  "task": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/completeTask

**Description:** Marks a task as completed, sets its priority to zero, and clears AI-inferred attributes.

**Requirements:**

* `task` exists.

**Effects:**

* The task is marked as completed.
* Its priority score is set to zero.
* All AI-inferred attributes (effort hours, importance, and difficulty) are cleared.
* The updated task is returned.

**Request Body:**

```json
{
  "task": "string"
}
```

**Success Response Body (Action):**

```json
{
  "task": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/markOverdue

**Description:** Marks a task as overdue and recalculates its priority to reflect increased urgency. This is typically a system-triggered action.

**Requirements:**

* `task` exists.
* `task.completed` is false.
* `current time > task.dueDate`.
* `task.overdue` is false.

**Effects:**

* The task is marked as overdue.
* The system automatically recalculates its priority to reflect the increased urgency.

**Request Body:**

```json
{
  "task": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/calculateTaskPriority

**Description:** Triggers an AI-enhanced priority calculation for a given task. This is typically a system-triggered action.

**Requirements:**

* `task` exists.
* `task.completed` is false.

**Effects:**

* The system attempts to use an LLM to infer the task's effort (in hours), importance (1-10), and difficulty (1-10) from its name and description.
* These attributes are validated against their specified ranges.
* If the LLM inference succeeds and validation passes, the task's inferred attributes are updated and the priority score is calculated by combining time urgency with weighted LLM attributes (importance × 50, difficulty × 30, 1/effort × 100 to prioritize quick wins).
* If the LLM inference fails or validation fails, the inferred attributes are cleared and the priority score is calculated based solely on time urgency (due date and overdue status).
* The timestamp of the last priority calculation is recorded.

**Request Body:**

```json
{
  "task": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/getTask

**Description:** Retrieves the full details of a specific task.

**Requirements:**

* `task` exists.

**Effects:**

* Returns the full task object with all fields.

**Request Body:**

```json
{
  "task": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "id": "string",
    "owner": "string",
    "name": "string",
    "description": "string",
    "dueDate": "string",
    "completed": "boolean",
    "overdue": "boolean",
    "inferredEffortHours": "number | null",
    "inferredImportance": "number | null",
    "inferredDifficulty": "number | null",
    "priorityScore": "number",
    "lastPriorityCalculationTime": "string | null"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/getTasksByOwner

**Description:** Retrieves all tasks for a given owner, sorted by priority score in descending order.

**Requirements:**

* `owner` exists.

**Effects:**

* Returns all tasks for the given owner, sorted by priorityScore (descending).

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "id": "string",
    "owner": "string",
    "name": "string",
    "description": "string",
    "dueDate": "string",
    "completed": "boolean",
    "overdue": "boolean",
    "inferredEffortHours": "number | null",
    "inferredImportance": "number | null",
    "inferredDifficulty": "number | null",
    "priorityScore": "number",
    "lastPriorityCalculationTime": "string | null"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/AIPrioritizedTask/getPrioritizedTasks

**Description:** Retrieves all non-completed tasks for a given owner, sorted by priority score in descending order.

**Requirements:**

* `owner` exists.

**Effects:**

* Returns all non-completed tasks for the given owner, sorted by priorityScore (descending).

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "id": "string",
    "owner": "string",
    "name": "string",
    "description": "string",
    "dueDate": "string",
    "completed": "boolean",
    "overdue": "boolean",
    "inferredEffortHours": "number | null",
    "inferredImportance": "number | null",
    "inferredDifficulty": "number | null",
    "priorityScore": "number",
    "lastPriorityCalculationTime": "string | null"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
