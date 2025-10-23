---
timestamp: 'Thu Oct 23 2025 01:49:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_014908.ed432ab5.md]]'
content_id: 644064acc83427f01ac59e14692d8563038e46ff4d61e0eb4374cd67b96220e6
---

# prompt: Revise the spec for AIPrioritizedTask if necessary. Consider whether any additional actions are needed and which actions are system vs user.

**concept** AIPrioritizedTask \[User]

**purpose** Compute personalized priority scores using LLM-inferred task attributes while preserving all original Task functionality

**principle** Tasks are created and managed identically to the original Task concept; Priority calculation is enhanced by LLM inference of effort, importance, and difficulty; If LLM inference fails validation, system falls back to time-based priority

**state**
a set of Tasks with
owner: User
name: String
description: String
dueDate: Time
completed: Boolean
overdue: Boolean
snoozeUntil: Time? // Optional, if snoozed
inferredEffortHours: Number? // LLM-inferred (0.5 to 40 hours), optional, validated
inferredImportance: Number? // LLM-inferred (1-10), optional, validated
inferredDifficulty: Number? // LLM-inferred (1-10), optional, validated
priorityScore: Number // Calculated value, higher is more urgent

invariants
each task name is unique per user
snoozed dates must be in the future relative to current due date
inferredEffortHours is between 0.5 and 40 when present
inferredImportance is between 1 and 10 when present
inferredDifficulty is between 1 and 10 when present

**actions**

createTask (owner: User, name: String, description: String, dueDate: Time): (task: Task)
**requires** name is non-empty, dueDate is valid
**effects**
adds fresh task with name, description, and dueDate
sets completed to false, overdue to false
sets all inferred attributes to null initially
triggers AI priority calculation
returns the task

snoozeTask (taskName: String, newDate: Time): (task: Task)
**requires** task exists and newDate is after current dueDate
**effects**
updates task's dueDate to newDate
sets overdue to false
recalculates priority score
returns updated task

completeTask (taskName: String): (task: Task)
**requires** task exists
**effects**
sets task's completed flag to true
sets priorityScore to 0
clears all AI-inferred attributes
returns updated task

markLate (taskName: String): (task: Task)
**requires** task exists and completed is false
**effects**
sets task's overdue flag to true
recalculates priority score
returns updated task

async getPriorityLLM (task: Task, endTime: Time, llm: GeminiLLM): (priority: Number)
**requires** task exists
**effects**
Calls LLM to extract effort (hours), importance (1-10), difficulty (1-10)
Validates all three attributes using validators
If validation passes: calculates enhanced priority combining time urgency
with weighted LLM attributes (importance 50%, difficulty 30%, effort 20%)
If validation fails or LLM errors: falls back to time-based priority calculation
Returns priority number (higher = more urgent)
**note** LLM insights amplify base time priority
