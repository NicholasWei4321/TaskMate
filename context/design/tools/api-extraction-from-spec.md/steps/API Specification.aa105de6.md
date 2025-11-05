---
timestamp: 'Mon Nov 03 2025 15:33:47 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251103_153347.e7fbce90.md]]'
content_id: aa105de6e51dcfd77624a3e82cadc81a01a614d30726a72a0de6ed4c2403db23
---

# API Specification: TodoList Concept

**Purpose:** Enable users to organize items into named, time-scoped collections with automatic lifecycle management including clearing completed items and recurring list recreation.

***

## API Endpoints

### POST /api/TodoList/createList

**Description:** Creates a new todo list for a user with specified name, time scope, auto-clear, and recurrence settings.

**Requirements:**

* name is non-empty
* for all existing L in Lists, if L.owner == owner then L.name != name
* if both startTime and endTime are provided, startTime <= endTime
* if recurrenceType is not none, both startTime and endTime must be provided

**Effects:**

* A new list is created with the provided name, owner, and settings.
* If time boundaries are not provided, startTime defaults to MIN\_DATE and endTime defaults to MAX\_DATE (making the list always active).
* If time boundaries are provided, the list is scoped to that time range.
* The autoClearCompleted flag determines whether completed items are automatically cleared.
* The recurrenceType determines if and how the list recreates itself.
* The list starts with an empty set of items and is returned.

**Request Body:**

```json
{
  "owner": "string",           // User ID
  "name": "string",
  "startTime": "string | null", // ISO 8601 date-time, optional
  "endTime": "string | null",   // ISO 8601 date-time, optional
  "autoClearCompleted": "boolean",
  "recurrenceType": "string"   // "none" | "daily" | "weekly" | "monthly"
}
```

**Success Response Body (Action):**

```json
{
  "list": "string"             // ID of the created List
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/TodoList/addListItem

**Description:** Adds an item to an existing todo list, optionally with a due date, respecting the list's time scope.

**Requirements:**

* list exists
* item is not already in list.items
* if list has startTime and itemDueDate is provided, itemDueDate >= list.startTime
* if list has endTime and itemDueDate is provided, itemDueDate <= list.endTime

**Effects:**

* The item is added to the list's set of items.
* If the list has time constraints and the item has a due date, the item is only added if it falls within the list's time range.

**Request Body:**

```json
{
  "list": "string",            // List ID
  "item": "string",            // Item ID
  "itemDueDate": "string | null" // ISO 8601 date-time, optional
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

### POST /api/TodoList/removeListItem

**Description:** Removes a specified item from a todo list.

**Requirements:**

* list exists AND item is in list.items

**Effects:**

* The item is removed from the list's set of items.

**Request Body:**

```json
{
  "list": "string", // List ID
  "item": "string"  // Item ID
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

### POST /api/TodoList/markItemCompleted

**Description:** Updates the completion status of an item within a specific todo list.

**Requirements:**

* list exists AND item is in list.items

**Effects:**

* The completion status of the item in the list is updated to the provided value.

**Request Body:**

```json
{
  "list": "string",    // List ID
  "item": "string",    // Item ID
  "completed": "boolean"
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

### POST /api/TodoList/deleteList

**Description:** Deletes an existing todo list.

**Requirements:**

* list exists

**Effects:**

* The list is removed from the set of all lists.

**Request Body:**

```json
{
  "list": "string" // List ID
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

### POST /api/TodoList/clearCompletedItems

**Description:** Removes all items marked as completed from a specific todo list.

**Requirements:**

* list exists

**Effects:**

* All items in the list where itemCompleted is true are removed from the list's items set.

**Request Body:**

```json
{
  "list": "string" // List ID
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

### POST /api/TodoList/updateListSettings

**Description:** Updates the auto-clear and/or recurrence settings of an existing todo list.

**Requirements:**

* list exists
* if recurrenceType is provided and is not none, list must have both startTime and endTime

**Effects:**

* If autoClearCompleted is provided, the list's autoClearCompleted flag is updated.
* If recurrenceType is provided, the list's recurrenceType is updated.

**Request Body:**

```json
{
  "list": "string",              // List ID
  "autoClearCompleted": "boolean | null", // Optional
  "recurrenceType": "string | null"     // "none" | "daily" | "weekly" | "monthly", optional
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

### POST /api/TodoList/autoClearIfNeeded

**Description:** (System Action) Automatically clears completed items from a list if its autoClearCompleted setting is true and its end time has passed.

**Requirements:**

* list exists
* list.autoClearCompleted is true
* current time is after list.endTime

**Effects:**

* Removes all items in the list where itemCompleted is true.

**Request Body:**

```json
{
  "list": "string" // List ID
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

### POST /api/TodoList/recreateRecurringList

**Description:** (System Action) Creates a new list for the next recurrence period if the current list is recurring and its end time has passed.

**Requirements:**

* list exists
* list.recurrenceType is not none
* current time is after list.endTime

**Effects:**

* A new list is created with the same name, owner, autoClearCompleted, and recurrenceType settings.
* The new list's time range is calculated based on the recurrenceType while maintaining the original list's duration (daily: +1 day, weekly: +1 week, monthly: +1 month).
* All uncompleted items from the old list are carried over to the new list with their due dates adjusted by the time shift.
* The original list remains unchanged (archived).

**Request Body:**

```json
{
  "list": "string" // List ID
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

### POST /api/TodoList/getListsForUser

**Description:** Retrieves all todo lists owned by a specified user.

**Requirements:**

* user is valid

**Effects:**

* Returns the set of all lists owned by the specified user.

**Request Body:**

```json
{
  "user": "string" // User ID
}
```

**Success Response Body (Query):**

```json
[
  {
    "name": "string",
    "owner": "string",            // User ID
    "items": ["string"],          // Array of Item IDs
    "startTime": "string",        // ISO 8601 date-time
    "endTime": "string",          // ISO 8601 date-time
    "autoClearCompleted": "boolean",
    "recurrenceType": "string"    // "none" | "daily" | "weekly" | "monthly"
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

### POST /api/TodoList/getListByName

**Description:** Retrieves a specific todo list by its name for a given user.

**Requirements:**

* user is valid, name is non-empty, list with name exists for user

**Effects:**

* Returns the list with the specified name owned by the user.

**Request Body:**

```json
{
  "user": "string", // User ID
  "name": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "name": "string",
    "owner": "string",            // User ID
    "items": ["string"],          // Array of Item IDs
    "startTime": "string",        // ISO 8601 date-time
    "endTime": "string",          // ISO 8601 date-time
    "autoClearCompleted": "boolean",
    "recurrenceType": "string"    // "none" | "daily" | "weekly" | "monthly"
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

### POST /api/TodoList/getActiveListsForUser

**Description:** Retrieves all active todo lists owned by a user, where "active" means the current time falls within the list's defined time range.

**Requirements:**

* user is valid

**Effects:**

* Returns the set of all lists owned by the user where current time is between startTime and endTime (inclusive).
* Lists created without explicit time ranges use MIN\_DATE/MAX\_DATE and are always active.

**Request Body:**

```json
{
  "user": "string" // User ID
}
```

**Success Response Body (Query):**

```json
[
  {
    "name": "string",
    "owner": "string",            // User ID
    "items": ["string"],          // Array of Item IDs
    "startTime": "string",        // ISO 8601 date-time
    "endTime": "string",          // ISO 8601 date-time
    "autoClearCompleted": "boolean",
    "recurrenceType": "string"    // "none" | "daily" | "weekly" | "monthly"
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
