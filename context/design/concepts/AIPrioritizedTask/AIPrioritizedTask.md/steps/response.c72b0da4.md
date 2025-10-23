---
timestamp: 'Wed Oct 22 2025 19:32:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251022_193227.e6d22785.md]]'
content_id: c72b0da409e36ba60ca7376874dd0452dce2239c90845355b303ccad9267a7aa
---

# response:

**concept** AIPrioritizedTask \[User]

**purpose** Enable users to efficiently manage and prioritize their tasks by dynamically ranking them based on a combination of time-based urgency and AI-inferred attributes, ensuring that critical tasks are highlighted even when AI inference is unavailable or fails.

**principle** If a user creates a new task with a due date and description, the system attempts to infer effort, importance, and difficulty using an LLM to calculate a comprehensive priority score. Should the LLM successfully provide valid attributes, the task's priority will reflect these insights; however, if the LLM inference fails or provides invalid data, the task will still receive a valid priority score based purely on its due date, ensuring it remains visible and actionable for the user. As the task approaches its due date or becomes overdue, its priority score will automatically adjust to reflect increased urgency.

**state**
a set of Tasks with
owner: User
name: String
description: String
dueDate: DateTime? // Optional, for tasks without a specific due date initially
completed: Boolean = false
overdue: Boolean = false
snoozeUntil: DateTime? // Optional, if snoozed
inferredEffortHours: Number? // LLM-inferred (e.g., 0.5 to 100), optional, validated
inferredImportance: Number? // LLM-inferred (1-10), optional, validated
inferredDifficulty: Number? // LLM-inferred (1-10), optional, validated
lastInferenceAttempt: DateTime? // Timestamp of the last LLM call attempt (success or failure)
priorityScore: Number = 0 // Calculated value, higher is more urgent

**actions**

createTask (owner: User, name: String, description: String, dueDate: DateTime?): (task: Task)
**requires** true
**effects**
create a new Task instance
set task.owner := owner
set task.name := name
set task.description := description
set task.dueDate := dueDate
set task.completed := false
set task.overdue := false
set task.snoozeUntil := null
set task.inferredEffortHours := null
set task.inferredImportance := null
set task.inferredDifficulty := null
set task.lastInferenceAttempt := null
// Trigger immediate priority calculation for the new task
\_triggerAIPriorityCalculation(task)
returns task

updateTask (task: Task, name: String?, description: String?, dueDate: DateTime?): ()
**requires** task exists and task.completed is false
**effects**
if name is provided, set task.name := name
if description is provided, set task.description := description
if dueDate is provided, set task.dueDate := dueDate
// If relevant fields changed, trigger AI re-evaluation and priority recalculation
if name or description or dueDate changed, \_triggerAIPriorityCalculation(task)
else \_calculatePriorityScore(task) // If only dueDate changed, AI inference isn't strictly needed

snoozeTask (task: Task, snoozeUntil: DateTime): ()
**requires** task exists and task.completed is false and snoozeUntil is after current time
**effects**
set task.snoozeUntil := snoozeUntil
set task.overdue := false // Snoozing temporarily removes overdue status
// Recalculate priority to reflect snooze
\_calculatePriorityScore(task)

completeTask (task: Task): ()
**requires** task exists and task.completed is false
**effects**
set task.completed := true
set task.priorityScore := 0 // Completed tasks have no priority
set task.overdue := false
set task.snoozeUntil := null
set task.inferredEffortHours := null // Clear inferred data for completed tasks
set task.inferredImportance := null
set task.inferredDifficulty := null

requestAIPriorityRecalculation (task: Task): ()
**requires** task exists and task.completed is false
**effects**
// Force an LLM re-run and full priority update
\_triggerAIPriorityCalculation(task)

**system** \_triggerAIPriorityCalculation (task: Task): ()
**requires** task exists and task.completed is false
**effects**
// Simulate calling an external LLM service
set task.lastInferenceAttempt := current time
// Assume LLM call attempts to return inferredEffortHours, inferredImportance, inferredDifficulty
// If LLM call succeeds and returns valid numbers (e.g., effort > 0, importance/difficulty 1-10):
set task.inferredEffortHours := (value from LLM)
set task.inferredImportance := (value from LLM)
set task.inferredDifficulty := (value from LLM)
// Else (LLM call fails or returns invalid values):
set task.inferredEffortHours := null
set task.inferredImportance := null
set task.inferredDifficulty := null
// Always follow up with priority score calculation
\_calculatePriorityScore(task)

**system** \_calculatePriorityScore (task: Task): ()
**requires** task exists and task.completed is false
**effects**
// 1. Calculate time-based urgency
let baseUrgency := 0
if task.snoozeUntil is set and task.snoozeUntil > current time:
// Task is snoozed, low urgency until snooze ends
baseUrgency := -100 // Example: very low priority when snoozed
else if task.dueDate is set:
let timeRemaining := task.dueDate - current time
if timeRemaining <= 0:
baseUrgency := 1000 // Overdue tasks have high base urgency
set task.overdue := true // Ensure overdue status is set
else if timeRemaining < 24 hours:
baseUrgency := 500 + (24 - (timeRemaining / 1 hour)) \* 10 // Higher as it gets closer
else:
baseUrgency := 100 + (100 - (timeRemaining / 1 day)) // Gradually increases
else:
baseUrgency := 50 // Tasks without due date have low base urgency

```
  // 2. Calculate AI-based score if available and valid
  let aiScore := 0
  if task.inferredEffortHours is not null and task.inferredImportance is not null and task.inferredDifficulty is not null:
    // Example formula: Importance * 5 + Difficulty * 3 + (1 / Effort) * 10
    aiScore := (task.inferredImportance * 5) + (task.inferredDifficulty * 3) + (1 / task.inferredEffortHours * 10)
  
  // 3. Combine scores
  set task.priorityScore := baseUrgency + aiScore
```

**system** \_monitorTasksForTimeEvents (): ()
**requires** true // This action runs periodically
**effects**
for each task in Tasks where task.completed is false:
// Check for overdue status
if task.dueDate is set and task.dueDate <= current time and task.snoozeUntil <= current time (or is null) and task.overdue is false:
set task.overdue := true
\_calculatePriorityScore(task) // Recalculate priority due to overdue status

```
    // Check if snooze period has ended
    if task.snoozeUntil is set and task.snoozeUntil <= current time:
      set task.snoozeUntil := null
      _calculatePriorityScore(task) // Recalculate priority as task is no longer snoozed

    // Periodically refresh priority score due to time passing (even if no status change)
    _calculatePriorityScore(task) // Ensures urgency updates dynamically
```
