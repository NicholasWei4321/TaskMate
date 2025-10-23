---
timestamp: 'Thu Oct 23 2025 01:49:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_014940.d01591a0.md]]'
content_id: e76a7a1394335581c71557c5080dd9342a8cc368eccb658341f36b53c2f759ba
---

# response:

Here's a revised specification for the `AIPrioritizedTask` concept, incorporating the feedback regarding state clarity, action types (user vs. system), and consistency with concept design principles (like generic parameters and separation of concerns).

The main changes are:

1. **`snoozeUntil` state variable removed**: The `snoozeTask` action already updates `dueDate`, making `snoozeUntil` redundant. If `snoozeUntil` were intended for temporary hiding without changing the hard deadline, the `snoozeTask` action would need a different definition. Assuming the former, `snoozeUntil` is removed.
2. **`updateTask` action added**: To preserve "all original Task functionality," a way to modify basic task properties (name, description, due date) is essential.
3. **`markLate` is now `system markOverdue`**: `Overdue` status is typically a system-computed property based on time, not a manual user action. This action ensures `overdue` is managed automatically.
4. **`getPriorityLLM` is now `system calculateTaskPriority`**: This action is now correctly defined as a `system` action that *mutates* the task's `priorityScore` state, rather than a query. It also avoids specific type references like `GeminiLLM`.
5. **Default priority on creation**: `createTask` now sets a default `priorityScore`, and *then* triggers the system action for AI prioritization.
6. **`lastPriorityCalculationTime` added to state**: This helps manage when the LLM inference last ran, allowing for debounce or periodic refresh logic.
7. **Invariants refined**: Clarified `task name unique per owner` and added `priorityScore is 0 when completed is true`.

***
