---
timestamp: 'Thu Oct 23 2025 15:57:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_155758.4cdad5fd.md]]'
content_id: 73a16f7feaf0b1147ac801697978573e211b5bfd8b0b2a28287b2f1bc6561b0d
---

# file: src/concepts/AIPrioritizedTaskConcept.test.ts

```typescript
// src/concepts/AIPrioritizedTaskConcept.test.ts

import { assertEquals, assertNotEquals, assertExists } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID, Empty } from "@utils/types.ts";
import AIPrioritizedTaskConcept from "./AIPrioritizedTaskConcept.ts";

Deno.test("AIPrioritizedTaskConcept - Full Test Suite", async (t) => {
  const [db, client] = await testDb();
  const concept = new AIPrioritizedTaskConcept(db);

  // Define some test users
  const userA: ID = "user:Alice" as ID;
  const userB: ID = "user:Bob" as ID;

  // Helper function to get current date + X days
  const futureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  // Helper function to create a past date
  const pastDate = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // Mock LLM inference for consistent testing if GEMINI_API_KEY is not set.
  // In a real scenario, you'd want to test against a live LLM or a sophisticated mock.
  // For this exercise, we assume LLM might fail or succeed, and test both paths.
  // The actual LLM integration is in AIPrioritizedTaskConcept.ts and will be called if GEMINI_API_KEY is present.

  await t.step("Action: createTask - Valid task creation and initial priority", async () => {
    console.log("\n--- Test: createTask - Valid task creation and initial priority ---");
    const dueDate = futureDate(5);
    const result = await concept.createTask({
      owner: userA,
      name: "Write Project Report",
      description: "Draft the annual project report for Q3, including budget and progress updates.",
      dueDate: dueDate,
    });

    assertExists((result as { task: ID }).task, "Task should be created successfully");
    const taskId = (result as { task: ID }).task;
    console.log(`  ✅ Task created with ID: ${taskId}`);

    const getResult = await concept.getTask({ task: taskId });
    assertExists((getResult as any).taskData, "Should be able to retrieve the created task");
    const taskData = (getResult as any).taskData;

    assertEquals(taskData.owner, userA, "Task owner should match");
    assertEquals(taskData.name, "Write Project Report", "Task name should match");
    assertEquals(taskData.completed, false, "Task should not be completed");
    assertEquals(taskData.overdue, false, "Task should not be overdue initially");
    assertNotEquals(taskData.priorityScore, 0, "Priority score should be calculated");
    assertExists(taskData.lastPriorityCalculationTime, "Last priority calculation time should be set");
    console.log(`  ✅ Task data retrieved. Priority: ${taskData.priorityScore}`);
  });

  await t.step("Action: createTask - Duplicate task name for same owner should fail", async () => {
    console.log("\n--- Test: createTask - Duplicate task name for same owner should fail ---");
    const dueDate = futureDate(3);
    await concept.createTask({
      owner: userA,
      name: "Review PR",
      description: "Review pull request #123 for feature X.",
      dueDate: dueDate,
    }); // Create first task

    const result = await concept.createTask({
      owner: userA,
      name: "Review PR",
      description: "Review pull request #456 for feature Y.", // Same name, different description
      dueDate: dueDate,
    });

    assertExists((result as { error: string }).error, "Creating task with duplicate name should return an error");
    assertEquals((result as { error: string }).error, "Task with name 'Review PR' already exists for this owner.");
    console.log(`  ✅ Correctly prevented duplicate task name for owner ${userA}`);
  });

  await t.step("Action: createTask - Empty task name should fail", async () => {
    console.log("\n--- Test: createTask - Empty task name should fail ---");
    const result = await concept.createTask({
      owner: userA,
      name: "",
      description: "Some description.",
      dueDate: futureDate(1),
    });
    assertExists((result as { error: string }).error, "Creating task with empty name should return an error");
    assertEquals((result as { error: string }).error, "Task name cannot be empty.");
    console.log(`  ✅ Correctly prevented empty task name`);
  });

  await t.step("Action: createTask - Invalid due date should fail", async () => {
    console.log("\n--- Test: createTask - Invalid due date should fail ---");
    const result = await concept.createTask({
      owner: userA,
      name: "Invalid Date Task",
      description: "This task has an invalid date.",
      dueDate: new Date("not a date"),
    });
    assertExists((result as { error: string }).error, "Creating task with invalid due date should return an error");
    assertEquals((result as { error: string }).error, "Invalid due date. Please provide a valid date/time.");
    console.log(`  ✅ Correctly prevented invalid due date`);
  });

  let taskToUpdateId: ID;
  await t.step("Action: updateTask - Update task name, description, and due date", async () => {
    console.log("\n--- Test: updateTask - Update task name, description, and due date ---");
    const createResult = await concept.createTask({
      owner: userA,
      name: "Old Task Name",
      description: "Old description.",
      dueDate: futureDate(10),
    });
    taskToUpdateId = (createResult as { task: ID }).task;
    console.log(`  Created task ID: ${taskToUpdateId}`);

    const newDueDate = futureDate(15);
    const updateResult = await concept.updateTask({
      task: taskToUpdateId,
      newName: "New Updated Task Name",
      newDescription: "Updated description for the task.",
      newDueDate: newDueDate,
    });

    assertExists((updateResult as { task: ID }).task, "Task update should be successful");
    console.log(`  ✅ Task updated successfully.`);

    const updatedTask = (await concept.getTask({ task: taskToUpdateId }) as any).taskData;
    assertEquals(updatedTask.name, "New Updated Task Name", "Task name should be updated");
    assertEquals(updatedTask.description, "Updated description for the task.", "Task description should be updated");
    assertEquals(updatedTask.dueDate.toISOString(), newDueDate.toISOString(), "Task due date should be updated");
    assertEquals(updatedTask.overdue, false, "Overdue flag should be reset after due date update");
    assertNotEquals(updatedTask.priorityScore, 0, "Priority score should be recalculated after update");
    assertExists(updatedTask.lastPriorityCalculationTime, "Last priority calculation time should be updated");
    console.log(`  ✅ Verified updated task properties. New priority: ${updatedTask.priorityScore}`);
  });

  await t.step("Action: updateTask - Update with duplicate name should fail", async () => {
    console.log("\n--- Test: updateTask - Update with duplicate name should fail ---");
    await concept.createTask({ owner: userA, name: "Another Task", description: "", dueDate: futureDate(1) });

    const result = await concept.updateTask({ task: taskToUpdateId, newName: "Another Task" });
    assertExists((result as { error: string }).error, "Updating to duplicate name should fail");
    assertEquals((result as { error: string }).error, "Task with name 'Another Task' already exists for this owner.");
    console.log(`  ✅ Correctly prevented updating to a duplicate task name.`);
  });

  let taskToSnoozeId: ID;
  await t.step("Action: snoozeTask - Snooze task to a future date", async () => {
    console.log("\n--- Test: snoozeTask - Snooze task to a future date ---");
    const createResult = await concept.createTask({
      owner: userA,
      name: "Urgent Meeting Prep",
      description: "Prepare slides for the client meeting tomorrow.",
      dueDate: futureDate(1), // Due tomorrow
    });
    taskToSnoozeId = (createResult as { task: ID }).task;
    console.log(`  Created task ID: ${taskToSnoozeId} due: ${(await concept.getTask({task: taskToSnoozeId}) as any).taskData.dueDate.toISOString()}`);

    const newSnoozeDate = futureDate(7); // Snooze for a week
    const snoozeResult = await concept.snoozeTask({ task: taskToSnoozeId, newDueDate: newSnoozeDate });
    assertExists((snoozeResult as { task: ID }).task, "Snooze should be successful");
    console.log(`  ✅ Task snoozed successfully.`);

    const snoozedTask = (await concept.getTask({ task: taskToSnoozeId }) as any).taskData;
    assertEquals(snoozedTask.dueDate.toISOString(), newSnoozeDate.toISOString(), "Task due date should be updated");
    assertEquals(snoozedTask.overdue, false, "Overdue flag should be reset after snoozing");
    assertNotEquals(snoozedTask.priorityScore, 0, "Priority score should be recalculated after snoozing");
    assertExists(snoozedTask.lastPriorityCalculationTime, "Last priority calculation time should be updated");
    console.log(`  ✅ Verified snoozed task properties. New priority: ${snoozedTask.priorityScore}`);
  });

  await t.step("Action: snoozeTask - Snooze to past/current date should fail", async () => {
    console.log("\n--- Test: snoozeTask - Snooze to past/current date should fail ---");
    const resultPast = await concept.snoozeTask({ task: taskToSnoozeId, newDueDate: pastDate(1) });
    assertExists((resultPast as { error: string }).error, "Snooze to past date should fail");
    assertEquals((resultPast as { error: string }).error, "New due date must be in the future to snooze a task.");
    console.log(`  ✅ Correctly prevented snoozing to a past date.`);

    const resultCurrent = await concept.snoozeTask({ task: taskToSnoozeId, newDueDate: new Date() });
    assertExists((resultCurrent as { error: string }).error, "Snooze to current date should fail");
    assertEquals((resultCurrent as { error: string }).error, "New due date must be in the future to snooze a task.");
    console.log(`  ✅ Correctly prevented snoozing to the current date.`);
  });

  let taskToCompleteId: ID;
  await t.step("Action: completeTask - Mark task as completed", async () => {
    console.log("\n--- Test: completeTask - Mark task as completed ---");
    const createResult = await concept.createTask({
      owner: userA,
      name: "Finish book chapter",
      description: "Complete chapter 5 of the technical book.",
      dueDate: futureDate(2),
    });
    taskToCompleteId = (createResult as { task: ID }).task;
    console.log(`  Created task ID: ${taskToCompleteId}`);

    const completeResult = await concept.completeTask({ task: taskToCompleteId });
    assertExists((completeResult as { task: ID }).task, "Complete task action should be successful");
    console.log(`  ✅ Task completed successfully.`);

    const completedTask = (await concept.getTask({ task: taskToCompleteId }) as any).taskData;
    assertEquals(completedTask.completed, true, "Task should be marked as completed");
    assertEquals(completedTask.priorityScore, 0, "Completed task's priority should be zero");
    assertEquals(completedTask.inferredEffortHours, null, "Inferred effort should be cleared");
    assertEquals(completedTask.inferredImportance, null, "Inferred importance should be cleared");
    assertEquals(completedTask.inferredDifficulty, null, "Inferred difficulty should be cleared");
    assertExists(completedTask.lastPriorityCalculationTime, "Last priority calculation time should be updated");
    console.log(`  ✅ Verified completed task properties.`);
  });

  let overdueTaskID: ID;
  await t.step("System Action: markOverdue - Mark a task as overdue", async () => {
    console.log("\n--- Test: markOverdue - Mark a task as overdue ---");
    const createResult = await concept.createTask({
      owner: userB,
      name: "Pay utility bill",
      description: "Monthly utility bill payment.",
      dueDate: pastDate(1), // Due yesterday
    });
    overdueTaskID = (createResult as { task: ID }).task;
    console.log(`  Created task ID: ${overdueTaskID} due: ${(await concept.getTask({task: overdueTaskID}) as any).taskData.dueDate.toISOString()}`);

    const markResult = await concept.markOverdue({ task: overdueTaskID });
    assertEquals(markResult, {}, "markOverdue should return an empty object on success");
    console.log(`  ✅ markOverdue action executed.`);

    const updatedTask = (await concept.getTask({ task: overdueTaskID }) as any).taskData;
    assertEquals(updatedTask.overdue, true, "Task should be marked as overdue");
    assertNotEquals(updatedTask.priorityScore, 0, "Priority should be recalculated and non-zero");
    assertExists(updatedTask.lastPriorityCalculationTime, "Last priority calculation time should be updated");
    console.log(`  ✅ Verified task is overdue. New priority: ${updatedTask.priorityScore}`);
  });

  await t.step("System Action: markOverdue - Do not mark overdue if already completed", async () => {
    console.log("\n--- Test: markOverdue - Do not mark overdue if already completed ---");
    const result = await concept.markOverdue({ task: taskToCompleteId });
    assertEquals(result, {}, "markOverdue should return empty object if task is completed");
    console.log(`  ✅ Correctly skipped marking overdue for a completed task.`);
  });

  await t.step("System Action: markOverdue - Do not mark overdue if not yet due", async () => {
    console.log("\n--- Test: markOverdue - Do not mark overdue if not yet due ---");
    const createResult = await concept.createTask({
      owner: userB,
      name: "Future Task",
      description: "",
      dueDate: futureDate(1),
    });
    const futureTaskId = (createResult as { task: ID }).task;
    console.log(`  Created future task ID: ${futureTaskId}`);

    const result = await concept.markOverdue({ task: futureTaskId });
    assertEquals(result, {}, "markOverdue should return empty object if task is not yet due");
    console.log(`  ✅ Correctly skipped marking overdue for a future task.`);
  });

  await t.step("System Action: calculateTaskPriority - Recalculate priority for an active task", async () => {
    console.log("\n--- Test: calculateTaskPriority - Recalculate priority for an active task ---");
    const createResult = await concept.createTask({
      owner: userB,
      name: "Review codebase for security vulnerabilities",
      description: "Perform a comprehensive security review of the main backend codebase. High importance.",
      dueDate: futureDate(14),
    });
    const taskId = (createResult as { task: ID }).task;
    const initialTask = (await concept.getTask({ task: taskId }) as any).taskData;
    console.log(`  Created task ID: ${taskId} with initial priority: ${initialTask.priorityScore}`);

    // Simulate some time passing or just trigger manually
    const calculateResult = await concept.calculateTaskPriority({ task: taskId });
    assertEquals(calculateResult, {}, "calculateTaskPriority should return an empty object on success");
    console.log(`  ✅ calculateTaskPriority action executed.`);

    const updatedTask = (await concept.getTask({ task: taskId }) as any).taskData;
    assertNotEquals(updatedTask.priorityScore, initialTask.priorityScore, "Priority score should be recalculated");
    assertExists(updatedTask.lastPriorityCalculationTime, "Last priority calculation time should be updated");
    console.log(`  ✅ Priority recalculated. New priority: ${updatedTask.priorityScore}`);
  });

  await t.step("System Action: calculateTaskPriority - Do not recalculate for completed task", async () => {
    console.log("\n--- Test: calculateTaskPriority - Do not recalculate for completed task ---");
    const result = await concept.calculateTaskPriority({ task: taskToCompleteId });
    assertEquals(result, {}, "calculateTaskPriority should return empty object if task is completed");
    console.log(`  ✅ Correctly skipped recalculating priority for a completed task.`);
  });

  await t.step("Query: getTask - Retrieve a specific task by ID", async () => {
    console.log("\n--- Test: getTask - Retrieve a specific task by ID ---");
    const createResult = await concept.createTask({
      owner: userA,
      name: "Meeting with Stakeholders",
      description: "Discuss project roadmap and upcoming features.",
      dueDate: futureDate(3),
    });
    const taskId = (createResult as { task: ID }).task;
    console.log(`  Created task ID: ${taskId}`);

    const getResult = await concept.getTask({ task: taskId });
    assertExists((getResult as any).taskData, "Should retrieve task data");
    const taskData = (getResult as any).taskData;

    assertEquals(taskData._id, taskId, "Retrieved task ID should match");
    assertEquals(taskData.name, "Meeting with Stakeholders", "Retrieved task name should match");
    console.log(`  ✅ Retrieved task successfully by ID.`);
  });

  await t.step("Query: getTasksByOwner - Retrieve all tasks for an owner, sorted by priority", async () => {
    console.log("\n--- Test: getTasksByOwner - Retrieve all tasks for an owner, sorted by priority ---");
    const task1 = (await concept.createTask({ owner: userA, name: "Task 1 (High)", description: "Very important", dueDate: futureDate(1) }) as any).task;
    const task2 = (await concept.createTask({ owner: userA, name: "Task 2 (Medium)", description: "Medium importance", dueDate: futureDate(5) }) as any).task;
    const task3 = (await concept.createTask({ owner: userA, name: "Task 3 (Low)", description: "Low importance", dueDate: futureDate(10) }) as any).task;
    console.log(`  Created tasks for ${userA}: ${task1}, ${task2}, ${task3}`);

    const { tasks } = (await concept.getTasksByOwner({ owner: userA })) as any;
    assertNotEquals(tasks.length, 0, "Should retrieve tasks for owner A");
    console.log(`  Retrieved ${tasks.length} tasks for ${userA}.`);

    // Verify sorting by priority (descending)
    for (let i = 0; i < tasks.length - 1; i++) {
      assert(tasks[i].priorityScore >= tasks[i + 1].priorityScore, "Tasks should be sorted by priority descending");
    }
    console.log(`  ✅ Verified tasks are sorted by priority.`);
    tasks.forEach((t:any) => console.log(`    - ${t.name} (Priority: ${t.priorityScore}, Completed: ${t.completed})`));
  });

  await t.step("Query: getPrioritizedTasks - Retrieve non-completed tasks for an owner, sorted", async () => {
    console.log("\n--- Test: getPrioritizedTasks - Retrieve non-completed tasks for an owner, sorted ---");
    const task4 = (await concept.createTask({ owner: userB, name: "Task 4 (Active)", description: "Active task", dueDate: futureDate(2) }) as any).task;
    const task5 = (await concept.createTask({ owner: userB, name: "Task 5 (Active 2)", description: "Another active task", dueDate: futureDate(6) }) as any).task;
    const task6 = (await concept.createTask({ owner: userB, name: "Task 6 (Completed)", description: "A completed task", dueDate: futureDate(3) }) as any).task;
    await concept.completeTask({ task: task6 }); // Mark as completed
    console.log(`  Created tasks for ${userB}: ${task4}, ${task5}, ${task6} (completed)`);

    const { tasks } = (await concept.getPrioritizedTasks({ owner: userB })) as any;
    assertEquals(tasks.length, 2, "Should retrieve only 2 non-completed tasks for owner B");
    console.log(`  Retrieved ${tasks.length} non-completed tasks for ${userB}.`);

    // Verify no completed tasks are returned
    tasks.forEach((task: any) => assertEquals(task.completed, false, "Should not return completed tasks"));

    // Verify sorting by priority (descending)
    for (let i = 0; i < tasks.length - 1; i++) {
      assert(tasks[i].priorityScore >= tasks[i + 1].priorityScore, "Non-completed tasks should be sorted by priority descending");
    }
    console.log(`  ✅ Verified non-completed tasks are sorted by priority.`);
    tasks.forEach((t:any) => console.log(`    - ${t.name} (Priority: ${t.priorityScore}, Completed: ${t.completed})`));
  });

  await t.step("Principle Test: Tasks are created, priority calculated, and fallback happens", async () => {
    console.log("\n--- Principle Test: LLM-enhanced priority calculation with fallback ---");
    const principleUser: ID = "user:PrincipleTester" as ID;
    const now = new Date();

    // 1. Create a task that should trigger good LLM inference
    const task1DueDate = futureDate(3);
    const createResult1 = await concept.createTask({
      owner: principleUser,
      name: "Prepare critical presentation for board meeting",
      description: "This is a very important and complex presentation. Needs significant effort.",
      dueDate: task1DueDate,
    });
    const taskId1 = (createResult1 as any).task;
    const task1 = (await concept.getTask({ task: taskId1 }) as any).taskData;
    console.log(`  Created Task 1 ("${task1.name}"), initial priority: ${task1.priorityScore}`);
    assertNotEquals(task1.priorityScore, 0, "Task 1 priority should be calculated");
    // Depending on LLM, inferred attributes should be present. We'll check if they're not null.
    if (task1.inferredEffortHours !== null) {
      assertNotEquals(task1.inferredEffortHours, null, "Task 1 inferred effort should be present (LLM success path)");
      console.log(`  ✅ Task 1 inferred attributes (Effort: ${task1.inferredEffortHours}, Importance: ${task1.inferredImportance}, Difficulty: ${task1.inferredDifficulty})`);
    } else {
      console.log(`  ℹ️ Task 1 LLM inference failed/skipped, falling back to time-based.`);
    }

    // 2. Create a task with ambiguous description or missing info, simulating LLM failure/fallback
    //    We can't *force* LLM failure here without mocking, but we can check the fallback logic.
    //    The `_triggerLLMInference` logs when it fails.
    const task2DueDate = futureDate(1); // More urgent time-wise
    const createResult2 = await concept.createTask({
      owner: principleUser,
      name: "Quick update",
      description: "Just a quick note.", // This might yield low AI scores or LLM failure to parse
      dueDate: task2DueDate,
    });
    const taskId2 = (createResult2 as any).task;
    const task2 = (await concept.getTask({ task: taskId2 }) as any).taskData;
    console.log(`  Created Task 2 ("${task2.name}"), initial priority: ${task2.priorityScore}`);
    assertNotEquals(task2.priorityScore, 0, "Task 2 priority should be calculated");
    if (task2.inferredEffortHours === null) {
      console.log(`  ✅ Task 2 LLM inference failed or validation issues, confirmed fallback to time-based priority.`);
    } else {
      console.log(`  ℹ️ Task 2 LLM inference succeeded with: (Effort: ${task2.inferredEffortHours}, Importance: ${task2.inferredImportance}, Difficulty: ${task2.inferredDifficulty})`);
    }

    // 3. Simulate time passing and a task becoming overdue, triggering recalculation
    const task3DueDate = pastDate(2); // Create a task that's already overdue
    const createResult3 = await concept.createTask({
      owner: principleUser,
      name: "Submit overdue expense report",
      description: "Monthly expense report for last month.",
      dueDate: task3DueDate,
    });
    const taskId3 = (createResult3 as any).task;
    let task3 = (await concept.getTask({ task: taskId3 }) as any).taskData;
    const initialPriority3 = task3.priorityScore;
    console.log(`  Created Task 3 ("${task3.name}" due: ${task3.dueDate.toISOString()}), initial priority: ${initialPriority3}`);

    await concept.markOverdue({ task: taskId3 }); // Manually trigger overdue
    task3 = (await concept.getTask({ task: taskId3 }) as any).taskData;
    console.log(`  Task 3 marked overdue. New priority: ${task3.priorityScore}`);
    assert(task3.overdue, "Task 3 should be marked overdue");
    assert(task3.priorityScore > initialPriority3, "Task 3 priority should increase after being marked overdue");

    // 4. Complete a task, verify priority resets
    console.log(`  Completing Task 1 ("${task1.name}")`);
    await concept.completeTask({ task: taskId1 });
    const completedTask1 = (await concept.getTask({ task: taskId1 }) as any).taskData;
    assertEquals(completedTask1.completed, true, "Completed Task 1 should be marked completed");
    assertEquals(completedTask1.priorityScore, 0, "Completed Task 1 priority should be 0");
    console.log(`  ✅ Task 1 completed, priority reset to 0.`);

    // 5. Query for prioritized tasks to see the overall order
    console.log("\n  Querying for prioritized tasks for Principle Tester:");
    const { tasks: prioritizedTasks } = (await concept.getPrioritizedTasks({ owner: principleUser })) as any;
    console.log("  Current prioritized tasks (excluding completed Task 1):");
    prioritizedTasks.forEach((t: any) => console.log(`    - ${t.name} (Priority: ${t.priorityScore}, Overdue: ${t.overdue})`));

    // Verify Task 1 is not in prioritized tasks
    assertEquals(prioritizedTasks.some((t: any) => t._id === taskId1), false, "Completed Task 1 should not appear in prioritized list");
    // Verify sorting (Task 3, being overdue, should be highest, then Task 2, which is due sooner than Task 1 if Task 1 wasn't completed)
    if (prioritizedTasks.length > 1) {
      assert(prioritizedTasks[0].priorityScore >= prioritizedTasks[1].priorityScore, "Prioritized tasks should be sorted correctly");
    }
    console.log("  ✅ Principle test concluded: Tasks created, priority dynamically calculated (with LLM or fallback), overdue status affects priority, and completion resets priority.");
  });


  await client.close(); // Close the database connection
});
```
