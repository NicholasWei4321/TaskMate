---
timestamp: 'Thu Oct 23 2025 13:06:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_130654.a90c3da1.md]]'
content_id: 448bab978a3fe049fc78c2850af70e3a74d7fe836d9d50797555ac4b075e32e3
---

# concept: AIPrioritizedTask

## Concept Specification

```concept
concept AIPrioritizedTask [Task, User, AIModel]

purpose
  to dynamically prioritize a collection of tasks using an AI model, allowing for user-initiated manual overrides and reversion to AI priority.

principle
  if an AI model assigns a priority to a task, the task will appear in prioritized lists according to that priority;
  if a user later overrides the AI's priority for that task, the task will then appear according to the user's chosen priority,
  and this override can be cleared by the user to revert the task's priority back to the AI-assigned priority.

state
  a set of PrioritizedTasks with
    a task Task (the identifier for the task being prioritized)
    a currentPriority Number (the effective priority, either AI-assigned or overridden)
    a aiAssignedPriority Number (the priority last assigned by an AI)
    a aiModel AIModel (the identifier of the AI model that last assigned `aiAssignedPriority`)
    a lastUpdated Number (timestamp of the last modification to this entry, in milliseconds)
    a isOverridden Boolean (true if a user has manually overridden the priority)
    a overriddenByUser User (optional, the identifier of the user who performed the override)
    a overriddenTimestamp Number (optional, timestamp of when the override occurred, in milliseconds)

actions

  registerTaskForPrioritization (task: Task) : (error: String)
    requires
      no PrioritizedTask entry for `task` already exists
    effects
      creates a new PrioritizedTask entry for `task`;
      sets `currentPriority` to a default (0);
      sets `aiAssignedPriority` to a default (0);
      sets `aiModel` to null;
      sets `lastUpdated` to current time;
      sets `isOverridden` to false;
      sets `overriddenByUser` and `overriddenTimestamp` to null.

  assignAIPriority (task: Task, aiModel: AIModel, priority: Number) : (error: String)
    requires
      a PrioritizedTask entry for `task` exists
      AND the task is NOT currently overridden by a user
    effects
      updates the `aiAssignedPriority` of `task` to `priority`;
      updates the `aiModel` to `aiModel`;
      updates `currentPriority` to `priority`;
      updates `lastUpdated` to current time.

  updateAIPriority (task: Task, aiModel: AIModel, newPriority: Number) : (error: String)
    requires
      a PrioritizedTask entry for `task` exists
      AND the task is NOT currently overridden by a user
      AND the `aiModel` matches the existing `aiModel` for the task (or existing `aiModel` is null)
    effects
      updates the `aiAssignedPriority` of `task` to `newPriority`;
      updates the `aiModel` to `aiModel`;
      updates `currentPriority` to `newPriority`;
      updates `lastUpdated` to current time.

  overridePriority (task: Task, user: User, newPriority: Number) : (error: String)
    requires
      a PrioritizedTask entry for `task` exists
    effects
      sets `currentPriority` of `task` to `newPriority`;
      sets `isOverridden` to true;
      sets `overriddenByUser` to `user`;
      sets `overriddenTimestamp` to current time;
      updates `lastUpdated` to current time.

  clearOverride (task: Task) : (error: String)
    requires
      a PrioritizedTask entry for `task` exists
      AND `isOverridden` is true for `task`
    effects
      sets `currentPriority` of `task` back to its `aiAssignedPriority`;
      sets `isOverridden` to false;
      sets `overriddenByUser` and `overriddenTimestamp` to null;
      updates `lastUpdated` to current time.

  removeTaskFromPrioritization (task: Task) : (error: String)
    requires
      a PrioritizedTask entry for `task` exists
    effects
      deletes the PrioritizedTask entry for `task`.

queries

  _getTaskPriority (task: Task) : (priority: Number, aiPriority: Number, aiModel: AIModel, lastUpdated: Number, isOverridden: Boolean, overriddenByUser: User, overriddenTimestamp: Number)[]
    requires
      a PrioritizedTask entry for `task` exists
    effects
      returns the details of the priority for `task`.

  _getPrioritizedTasks (limit: Number, offset: Number) : (task: Task, priority: Number)[]
    requires
      true
    effects
      returns a list of tasks and their current priorities, sorted by `currentPriority` (descending), limited by `limit` and offset by `offset`.

  _getOverriddenTasks () : (task: Task, priority: Number, overriddenByUser: User)[]
    requires
      true
    effects
      returns a list of tasks that have been manually overridden, along with their current priority and the user who overrode it.
```

***
