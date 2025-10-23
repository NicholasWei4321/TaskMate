# AIPrioritizedTask

**concept** AIPrioritizedTask \[User]

**purpose** Compute personalized priority scores using LLM-inferred task attributes while preserving all original Task functionality

**principle** Tasks are created and managed identically to the original Task concept; Priority calculation is enhanced by LLM inference of effort, importance, and difficulty; If LLM inference fails validation, system falls back to time-based priority

**state**
`a set of Tasks with`
  `owner: User`
  `name: String`
  `description: String`
  `dueDate: Time`
  `completed: Flag`
  `overdue: Flag`
  `inferredEffortHours: Number?` // LLM-inferred (0.5 to 40 hours), optional, validated
  `inferredImportance: Number?` // LLM-inferred (1-10), optional, validated
  `inferredDifficulty: Number?` // LLM-inferred (1-10), optional, validated
  `priorityScore: Number` // Calculated value, higher is more urgent
  `lastPriorityCalculationTime: Time?` // Timestamp of the last successful priority calculation using LLM or fallback

**actions**

`createTask (owner: User, name: String, description: String, dueDate: Time): (task: Task)`
  **requires** `name` is non-empty and unique for the `owner`, `dueDate` is valid.
  **effects**
    A new task is created with the provided owner, name, description, and due date. The task is initially marked as incomplete and not overdue. All AI-inferred attributes start as null, and the priority score is set to an initial time-based value (higher for tasks with closer due dates). The system automatically triggers an AI-enhanced priority calculation for the new task and returns it.

`updateTask (task: Task, newName: String?, newDescription: String?, newDueDate: Time?): (task: Task)`
  **requires** `task` exists. If `newName` is provided, it is non-empty and unique for `task.owner` (excluding the current `task`). If `newDueDate` is provided, it is valid.
  **effects**
    The task's properties are updated with any provided new values. If the name is provided, the task's name is changed. If the description is provided, it is updated. If a new due date is provided, the task's due date is changed and the overdue flag is reset. After any updates, the system recalculates the task's priority and returns the updated task.

`snoozeTask (task: Task, newDueDate: Time): (task: Task)`
  **requires** `task` exists and `newDueDate` is in the future relative to the current time.
  **effects**
    The task's due date is updated to the new date, and the overdue flag is reset to false. The system recalculates the task's priority to reflect the new deadline and returns the updated task.

`completeTask (task: Task): (task: Task)`
  **requires** `task` exists
  **effects**
    The task is marked as completed, and its priority score is set to zero. All AI-inferred attributes (effort hours, importance, and difficulty) are cleared, and the updated task is returned.

**system** `markOverdue (task: Task)`
  **requires** `task` exists, `task.completed` is false, `current time > task.dueDate`, and `task.overdue` is false.
  **effects**
    The task is marked as overdue, and the system automatically recalculates its priority to reflect the increased urgency.

**system** `calculateTaskPriority (task: Task)`
  **requires** `task` exists, `task.completed` is false.
  **effects**
    The system attempts to use an LLM to infer the task's effort (in hours), importance (1-10), and difficulty (1-10) from its name and description. These attributes are validated against their specified ranges. If the LLM inference succeeds and validation passes, the task's inferred attributes are updated and the priority score is calculated by combining time urgency with weighted LLM attributes (importance × 50, difficulty × 30, 1/effort × 100 to prioritize quick wins). If the LLM inference fails or validation fails, the inferred attributes are cleared and the priority score is calculated based solely on time urgency (due date and overdue status). The timestamp of the last priority calculation is recorded.

**queries**

`getTask (task: Task): (taskData: TaskDocument)`
  **requires** `task` exists
  **effects** returns the full task object with all fields

`getTasksByOwner (owner: User): (tasks: set of TaskDocument)`
  **requires** `owner` exists
  **effects** returns all tasks for the given owner, sorted by priorityScore (descending)

`getPrioritizedTasks (owner: User): (tasks: set of TaskDocument)`
  **requires** `owner` exists
  **effects** returns all non-completed tasks for the given owner, sorted by priorityScore (descending)

**notes**
Priority formula: timeBasedScore + (importance × 50) + (difficulty × 30) + (1/effort × 100)
The inverse effort weighting prioritizes quick wins (low effort tasks get higher scores).
Fallback to time-based priority ensures the system remains usable even if AI fails.