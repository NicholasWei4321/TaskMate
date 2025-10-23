Operational Principle: Create → Update → Prioritize → Complete workflow ...
------- output -------

=== OPERATIONAL PRINCIPLE TEST ===

1. Creating task with rich description...
🤖 Calling LLM for task: "Prepare critical presentation for board meeting"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 20,
  "importance": 9,
  "difficulty": 8
}
```
======================

  ✅ Created task: "Prepare critical presentation for board meeting"
     Priority: 1545
     LLM Attributes: Effort=20, Importance=9, Difficulty=8

2. Updating task with new due date...
🤖 Calling LLM for task: "Prepare critical presentation for board meeting"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 10,
  "importance": 9,
  "difficulty": 7
}
```
======================

  ✅ Updated task. New priority: 1620

3. Creating overdue task and marking it...
🤖 Calling LLM for task: "Submit overdue expense report"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 7,
  "difficulty": 4
}
```
======================

🤖 Calling LLM for task: "Submit overdue expense report"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 7,
  "difficulty": 3
}
```
======================

  ✅ Marked task as overdue. Priority: 1510

4. Querying prioritized tasks...
  Retrieved 2 prioritized tasks:
    - Prepare critical presentation for board meeting (Priority: 1620, Overdue: false)
    - Submit overdue expense report (Priority: 1510, Overdue: true)

5. Completing task...
  ✅ Completed task: "Prepare critical presentation for board meeting"

6. Verifying completed task excluded from prioritized list...
  ✅ Prioritized list now has 1 tasks (completed task excluded)

=== OPERATIONAL PRINCIPLE TEST PASSED ===
----- output end -----
Operational Principle: Create → Update → Prioritize → Complete workflow ... ok (3s)
Action: createTask - Valid task creation with initial priority ...
------- output -------

=== TEST: createTask - Valid Creation ===
🤖 Calling LLM for task: "Write Project Report"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 8,
  "importance": 7,
  "difficulty": 5
}
```
======================

  ✅ Task created with ID: 019a130c-c4a7-7156-aa24-0182ea0f0360
  ✅ Verified task properties. Priority: 1263
     Input: owner=user:Alice, name="Write Project Report", due=2025-10-28T21:49:55.220Z
     Output: completed=false, overdue=false, priority=1263
----- output end -----
Action: createTask - Valid task creation with initial priority ... ok (1s)
Action: createTask - Duplicate task name should fail ...
------- output -------

=== TEST: createTask - Duplicate Name ===
🤖 Calling LLM for task: "Review PR"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 4,
  "importance": 7,
  "difficulty": 5
}
```
======================

  Created first task: "Review PR" for user:Alice
  ✅ Correctly prevented duplicate task name for owner user:Alice
     Input: owner=user:Alice, name="Review PR" (duplicate)
     Output: error="Task with name 'Review PR' already exists for this owner."
----- output end -----
Action: createTask - Duplicate task name should fail ... ok (1s)
Action: createTask - Empty task name should fail ...
------- output -------

=== TEST: createTask - Empty Name ===
  ✅ Correctly prevented empty task name
     Input: name="" (empty)
     Output: error="Task name cannot be empty."
----- output end -----
Action: createTask - Empty task name should fail ... ok (581ms)
Action: createTask - Invalid due date should fail ...
------- output -------

=== TEST: createTask - Invalid Date ===
  ✅ Correctly prevented invalid due date
     Input: dueDate=new Date("not a date") (invalid)
     Output: error="Invalid due date. Please provide a valid date/time."
----- output end -----
Action: createTask - Invalid due date should fail ... ok (541ms)
Action: updateTask - Update name, description, and due date ...
------- output -------

=== TEST: updateTask - Valid Update ===
🤖 Calling LLM for task: "Old Task Name"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 7,
  "difficulty": 4
}
```
======================

  Created task ID: 019a130c-d2d9-7851-9bba-1ddbe0ab4e72
🤖 Calling LLM for task: "New Updated Task Name"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 5,
  "difficulty": 4
}
```
======================

  ✅ Task updated successfully
  ✅ Verified updated properties. New priority: 668
     Input: newName="New Updated Task Name", newDescription="Updated...", newDueDate=2025-11-07T22:49:59.445Z
     Output: name="New Updated Task Name", priority=668
----- output end -----
Action: updateTask - Update name, description, and due date ... ok (1s)
Action: updateTask - Update with duplicate name should fail ...
------- output -------

=== TEST: updateTask - Duplicate Name ===
🤖 Calling LLM for task: "Task One"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1,
  "importance": 5,
  "difficulty": 3
}
```
======================

🤖 Calling LLM for task: "Task Two"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 5,
  "difficulty": 4
}
```
======================

  Created two tasks: "Task One" and "Task Two"
  ✅ Correctly prevented updating to a duplicate task name
     Input: newName="Task Two" (already exists)
     Output: error="Task with name 'Task Two' already exists for this owner."
----- output end -----
Action: updateTask - Update with duplicate name should fail ... ok (2s)
Action: updateTask - Update with empty name should fail ...
------- output -------

=== TEST: updateTask - Empty Name ===
🤖 Calling LLM for task: "Valid Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 5,
  "difficulty": 3
}
```
======================

  Created task: "Valid Task"
  ✅ Correctly prevented updating to empty name
     Input: newName="" (empty)
     Output: error="New task name cannot be empty."
----- output end -----
Action: updateTask - Update with empty name should fail ... ok (1s)
Action: snoozeTask - Snooze task to future date ...
------- output -------

=== TEST: snoozeTask - Valid Snooze ===
🤖 Calling LLM for task: "Urgent Meeting Prep"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 4,
  "importance": 8,
  "difficulty": 5
}
```
======================

  Created task due: 2025-10-24T21:50:04.063Z
🤖 Calling LLM for task: "Urgent Meeting Prep"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 6.0,
  "importance": 8,
  "difficulty": 5
}
```
======================

  ✅ Task snoozed successfully
  ✅ Verified snoozed task. New priority: 1217
     Input: newDueDate=2025-10-30T21:50:04.623Z
     Output: dueDate=2025-10-30T21:50:04.623Z, priority=1217
----- output end -----
Action: snoozeTask - Snooze task to future date ... ok (1s)
Action: snoozeTask - Snooze to past date should fail ...
------- output -------

=== TEST: snoozeTask - Past Date ===
🤖 Calling LLM for task: "Task to Snooze"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 0.5,
  "importance": 1,
  "difficulty": 1
}
```
======================

  Created task to snooze
  ✅ Correctly prevented snoozing to a past date
     Input: newDueDate=2025-10-22T21:50:06.313Z (in the past)
     Output: error="New due date must be in the future to snooze a task."
----- output end -----
Action: snoozeTask - Snooze to past date should fail ... ok (1s)
Action: snoozeTask - Snooze to current time should fail ...
------- output -------

=== TEST: snoozeTask - Current Time ===
🤖 Calling LLM for task: "Another Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 4.0,
  "importance": 6.0,
  "difficulty": 5.0
}
```
======================

  Created task to snooze
  ✅ Correctly prevented snoozing to current time
     Input: newDueDate=new Date() (current time)
     Output: error="New due date must be in the future to snooze a task."
----- output end -----
Action: snoozeTask - Snooze to current time should fail ... ok (1s)
Action: completeTask - Mark task as completed ...
------- output -------

=== TEST: completeTask - Mark Completed ===
🤖 Calling LLM for task: "Finish book chapter"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 12.0,
  "importance": 8,
  "difficulty": 6
}
```
======================

  Created task ID: 019a130c-f734-77d1-b179-276060c68eb0
  ✅ Task completed successfully
  ✅ Verified completed task properties
     Input: task=019a130c-f734-77d1-b179-276060c68eb0
     Output: completed=true, priority=0, AI attributes=null
----- output end -----
Action: completeTask - Mark task as completed ... ok (1s)
System Action: markOverdue - Mark overdue task ...
------- output -------

=== TEST: markOverdue - Mark Overdue ===
🤖 Calling LLM for task: "Pay utility bill"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 8,
  "difficulty": 2
}
```
======================

  Created overdue task due: 2025-10-22T21:50:09.697Z
     Initial overdue flag: false
     Initial priority: 1560
🤖 Calling LLM for task: "Pay utility bill"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 8,
  "difficulty": 2
}
```
======================

  ✅ markOverdue action executed
  ✅ Verified task is overdue. Priority: 1570
     Input: task=019a130c-fd34-7bac-8832-78b3508d820b (past due date)
     Output: overdue=true, priority=1570
----- output end -----
System Action: markOverdue - Mark overdue task ... ok (1s)
System Action: markOverdue - Skip if task is completed ...
------- output -------

=== TEST: markOverdue - Skip Completed ===
🤖 Calling LLM for task: "Completed Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 5,
  "difficulty": 3
}
```
======================

  Created and completed task
  ✅ Correctly skipped marking overdue for completed task
     Input: task=019a130d-03f4-7dcd-8ce2-707397b6391e (completed)
     Output: {} (no action taken), overdue=false
----- output end -----
System Action: markOverdue - Skip if task is completed ... ok (1s)
System Action: markOverdue - Skip if task not yet due ...
------- output -------

=== TEST: markOverdue - Skip Future Task ===
🤖 Calling LLM for task: "Future Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1,
  "importance": 4,
  "difficulty": 3
}
```
======================

  Created future task
  ✅ Correctly skipped marking overdue for future task
     Input: task=019a130d-09a4-718d-81e2-9f930e8a33eb (future due date)
     Output: {} (no action taken), overdue=false
----- output end -----
System Action: markOverdue - Skip if task not yet due ... ok (1s)
System Action: calculateTaskPriority - Recalculate priority ...
------- output -------

=== TEST: calculateTaskPriority - Recalculate ===
🤖 Calling LLM for task: "Review codebase for security vulnerabilities"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 20,
  "importance": 9,
  "difficulty": 7
}
```
======================

  Created task with initial priority: 963
🤖 Calling LLM for task: "Review codebase for security vulnerabilities"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 20,
  "importance": 9,
  "difficulty": 7
}
```
======================

  ✅ calculateTaskPriority action executed
  ✅ Priority recalculated. Priority: 963
     Input: task=019a130d-0e53-7e1c-a5da-c4a715781bff
     Output: priority=963, lastCalcTime updated
----- output end -----
System Action: calculateTaskPriority - Recalculate priority ... ok (1s)
System Action: calculateTaskPriority - Skip if task completed ...
------- output -------

=== TEST: calculateTaskPriority - Skip Completed ===
🤖 Calling LLM for task: "Another Completed Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 5,
  "difficulty": 3
}
```
======================

  Created and completed task
  ✅ Correctly skipped recalculating priority for completed task
     Input: task=019a130d-15f9-73b5-a9b7-419315933038 (completed)
     Output: {} (no action taken), priority=0
----- output end -----
System Action: calculateTaskPriority - Skip if task completed ... ok (1s)
Query: getTask - Retrieve specific task by ID ...
------- output -------

=== TEST: getTask - Retrieve by ID ===
🤖 Calling LLM for task: "Meeting with Stakeholders"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 4.0,
  "importance": 7,
  "difficulty": 5
}
```
======================

  Created task ID: 019a130d-1afb-7d44-aa94-fe0fffa05f9f
  ✅ Retrieved task successfully by ID
     Input: task=019a130d-1afb-7d44-aa94-fe0fffa05f9f
     Output: taskData={_id=019a130d-1afb-7d44-aa94-fe0fffa05f9f, name="Meeting with Stakeholders", owner=user:Alice}
----- output end -----
Query: getTask - Retrieve specific task by ID ... ok (1s)
Query: getTasksByOwner - Retrieve all tasks sorted by priority ...
------- output -------

=== TEST: getTasksByOwner - Retrieve and Sort ===
🤖 Calling LLM for task: "High Priority"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 2.0,
  "importance": 8,
  "difficulty": 4
}
```
======================

🤖 Calling LLM for task: "Medium Priority"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 4.0,
  "importance": 5,
  "difficulty": 5
}
```
======================

🤖 Calling LLM for task: "Low Priority"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 2,
  "difficulty": 1
}
```
======================

  Created 3 tasks for user:GetTasksByOwnerTest
  Retrieved 3 tasks
  ✅ Verified tasks are sorted by priority (descending)
    - High Priority (Priority: 1520, Completed: false)
    - Medium Priority (Priority: 1175, Completed: false)
    - Low Priority (Priority: 728, Completed: false)
     Input: owner=user:GetTasksByOwnerTest
     Output: tasks array with 3 items, sorted by priority
----- output end -----
Query: getTasksByOwner - Retrieve all tasks sorted by priority ... ok (2s)
Query: getPrioritizedTasks - Retrieve only non-completed tasks ...
------- output -------

=== TEST: getPrioritizedTasks - Filter Completed ===
🤖 Calling LLM for task: "Active Task 1"...

🤖 RAW GEMINI RESPONSE
======================
{
  "effort": 1.0,
  "importance": 5,
  "difficulty": 3
}
======================

🤖 Calling LLM for task: "Active Task 2"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 1.0,
  "importance": 5,
  "difficulty": 3
}
```
======================

🤖 Calling LLM for task: "Completed Task"...

🤖 RAW GEMINI RESPONSE
======================
```json
{
  "effort": 0.5,
  "importance": 1,
  "difficulty": 1
}
```
======================

  Created 3 tasks (1 completed) for user:GetPrioritizedTasksTest
  Retrieved 2 non-completed tasks
  ✅ Verified only non-completed tasks returned and sorted by priority
    - Active Task 1 (Priority: 1340, Completed: false)
    - Active Task 2 (Priority: 1140, Completed: false)
     Input: owner=user:GetPrioritizedTasksTest
     Output: tasks array with 2 non-completed items, sorted by priority
----- output end -----