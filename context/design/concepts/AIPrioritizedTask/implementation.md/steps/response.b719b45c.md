---
timestamp: 'Thu Oct 23 2025 13:11:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_131100.45b733bc.md]]'
content_id: b719b45c39fefbc6abe3fa62735f4566a29d73378e2df70a7987f48686c5d2f1
---

# response:

Here is the TypeScript implementation for the `AIPrioritizedTask` concept, following the specified structure, conventions, and MongoDB integration guidelines.

```typescript
// src/concepts/AIPrioritizedTaskConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "AIPrioritizedTask" + ".";

// Generic types of this concept
type User = ID; // Represents the identifier for a user, external to this concept
type Task = ID; // Represents the identifier for a specific task instance

/**
 * Interface for the Task document in MongoDB.
 * Corresponds to: `a set of Tasks with ...` in the state specification.
 */
interface TaskDocument {
  _id: Task;
  owner: User;
  name: string;
  description: string;
  dueDate: Date; // Using Date object for 'Time' from spec
  completed: boolean;
  overdue: boolean;
  inferredEffortHours: number | null; // LLM-inferred (0.5 to 40 hours), optional, validated
  inferredImportance: number | null; // LLM-inferred (1-10), optional, validated
  inferredDifficulty: number | null; // LLM-inferred (1-10), optional, validated
  priorityScore: number; // Calculated value, higher is more urgent
  lastPriorityCalculationTime: Date | null; // Timestamp of the last successful priority calculation using LLM or fallback
}

/**
 * **concept** AIPrioritizedTask [User]
 *
 * **purpose** Compute personalized priority scores using LLM-inferred task attributes
 *             while preserving all original Task functionality.
 *
 * **principle** Tasks are created and managed identically to the original Task concept;
 *                Priority calculation is enhanced by LLM inference of effort, importance,
 *                and difficulty; If LLM inference fails validation, system falls back
 *                to time-based priority.
 */
export default class AIPrioritizedTaskConcept {
  tasks: Collection<TaskDocument>;

  constructor(private readonly db: Db) {
    this.tasks = this.db.collection(PREFIX + "tasks");
  }

  // --- Helper/Internal Functions ---

  /**
   * Placeholder for LLM inference. In a real system, this would call an external AI service.
   * This mock function returns simulated data or null to simulate failure.
   */
  private async _triggerLLMInference(name: string, description: string): Promise<{
    effort: number;
    importance: number;
    difficulty: number;
  } | null> {
    // Simulate LLM processing time
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Simple heuristic for mock data:
    const lowerName = name.toLowerCase();
    const lowerDescription = description.toLowerCase();

    let effort = 5; // default
    let importance = 5; // default
    let difficulty = 5; // default

    if (lowerName.includes("quick") || lowerDescription.includes("brief")) effort = 1;
    if (lowerDescription.includes("urgent") || lowerName.includes("critical")) importance = 9;
    if (lowerName.includes("complex") || lowerDescription.includes("intricate")) difficulty = 8;
    if (lowerDescription.includes("simple") || lowerName.includes("easy")) difficulty = 2;
    if (lowerName.includes("major") || lowerDescription.includes("significant")) effort = 20;

    // Simulate occasional LLM failure (e.g., due to API errors, content moderation, etc.)
    if (Math.random() < 0.1) { // 10% chance of failure
      console.warn(`LLM inference simulated failure for task: "${name}"`);
      return null;
    }

    // Add some randomness and ensure values are within bounds
    return {
      effort: parseFloat((Math.max(0.5, Math.min(40, effort + Math.random() * 5 - 2.5))).toFixed(1)),
      importance: Math.max(1, Math.min(10, Math.round(importance + Math.random() * 3 - 1.5))),
      difficulty: Math.max(1, Math.min(10, Math.round(difficulty + Math.random() * 3 - 1.5))),
    };
  }

  /**
   * Validates LLM-inferred attributes against their specified ranges.
   */
  private _validateInferredAttributes(
    effort: number,
    importance: number,
    difficulty: number,
  ): boolean {
    return (
      effort >= 0.5 && effort <= 40 &&
      importance >= 1 && importance <= 10 &&
      difficulty >= 1 && difficulty <= 10
    );
  }

  /**
   * Calculates a priority score based solely on time urgency.
   * This serves as the initial priority and fallback mechanism.
   * - Closer due dates result in higher priority.
   * - Overdue tasks receive a significant boost.
   */
  private _calculateTimeBasedPriority(dueDate: Date, overdue: boolean): number {
    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysUntilDue = (dueDate.getTime() - now.getTime()) / msPerDay;

    let score = 0;

    if (overdue) {
      score += 1000; // Base for overdue tasks
      score += Math.max(0, Math.min(500, -daysUntilDue * 10)); // Overdue longer = higher, capped
    } else {
      score += Math.max(0, Math.min(1000, 1000 - daysUntilDue * 50)); // Closer due date = higher, capped
    }
    return Math.round(score);
  }

  /**
   * Calculates an AI-enhanced priority score by combining time urgency
   * with weighted LLM-inferred attributes.
   * Weights are illustrative and would be tuned in a real application.
   */
  private _calculateAIPriority(
    dueDate: Date,
    overdue: boolean,
    effortHours: number,
    importance: number,
    difficulty: number,
  ): number {
    const timeBasedScore = this._calculateTimeBasedPriority(dueDate, overdue);

    // Illustrative weights for AI attributes
    const importanceWeight = 20;  // High importance impact
    const difficultyWeight = 15;  // Moderate difficulty impact
    const effortWeight = 1;       // Lower impact for effort hours, to balance against urgency

    const aiScoreComponent = (importance * importanceWeight) +
      (difficulty * difficultyWeight) +
      (effortHours * effortWeight);

    return Math.round(timeBasedScore + aiScoreComponent);
  }

  /**
   * Encapsulates the logic for performing LLM inference, validating,
   * calculating the priority score, and updating the task in the database.
   * This centralizes the priority calculation logic used by multiple actions.
   *
   * @param taskDoc The current TaskDocument to recalculate priority for.
   */
  private async _recalculateAndSavePriority(taskDoc: TaskDocument): Promise<void> {
    const updateFields: Partial<TaskDocument> = {};

    if (taskDoc.completed) {
      // Completed tasks have 0 priority, clear AI attributes
      updateFields.priorityScore = 0;
      updateFields.inferredEffortHours = null;
      updateFields.inferredImportance = null;
      updateFields.inferredDifficulty = null;
    } else {
      const inferred = await this._triggerLLMInference(taskDoc.name, taskDoc.description);

      if (
        inferred &&
        this._validateInferredAttributes(
          inferred.effort,
          inferred.importance,
          inferred.difficulty,
        )
      ) {
        // LLM inference successful and validated
        updateFields.inferredEffortHours = inferred.effort;
        updateFields.inferredImportance = inferred.importance;
        updateFields.inferredDifficulty = inferred.difficulty;
        updateFields.priorityScore = this._calculateAIPriority(
          taskDoc.dueDate,
          taskDoc.overdue,
          inferred.effort,
          inferred.importance,
          inferred.difficulty,
        );
      } else {
        // Fallback to time-based if LLM fails or validation fails
        updateFields.inferredEffortHours = null;
        updateFields.inferredImportance = null;
        updateFields.inferredDifficulty = null;
        updateFields.priorityScore = this._calculateTimeBasedPriority(
          taskDoc.dueDate,
          taskDoc.overdue,
        );
      }
    }
    updateFields.lastPriorityCalculationTime = new Date();

    // Update the task in the database with the new priority and inferred attributes
    await this.tasks.updateOne(
      { _id: taskDoc._id },
      { $set: updateFields },
    );

    // Update the local taskDoc object to reflect the changes for subsequent operations
    Object.assign(taskDoc, updateFields);
  }

  // --- Actions ---

  /**
   * createTask (owner: User, name: String, description: String, dueDate: Time): (task: Task)
   *
   * **requires** `name` is non-empty and unique for the `owner`, `dueDate` is valid.
   *
   * **effects**
   * A new task is created with the provided owner, name, description, and due date.
   * The task is initially marked as incomplete and not overdue.
   * All AI-inferred attributes start as null, and the priority score is set to an initial time-based value
   * (higher for tasks with closer due dates).
   * The system automatically triggers an AI-enhanced priority calculation for the new task and returns it.
   */
  async createTask(
    { owner, name, description, dueDate }: {
      owner: User;
      name: string;
      description: string;
      dueDate: Date;
    },
  ): Promise<{ task: Task } | { error: string }> {
    // Requires: name is non-empty
    if (!name || name.trim() === "") {
      return { error: "Task name cannot be empty." };
    }

    // Requires: dueDate is valid
    if (isNaN(dueDate.getTime())) {
      return { error: "Invalid due date. Please provide a valid date/time." };
    }

    // Requires: name is unique for the owner
    const existingTask = await this.tasks.findOne({ owner, name });
    if (existingTask) {
      return { error: `Task with name '${name}' already exists for this owner.` };
    }

    const newTaskId: Task = freshID() as Task;
    const initialPriority = this._calculateTimeBasedPriority(dueDate, false); // Initialize with time-based priority

    const newTaskDoc: TaskDocument = {
      _id: newTaskId,
      owner,
      name,
      description,
      dueDate,
      completed: false,
      overdue: false,
      inferredEffortHours: null,
      inferredImportance: null,
      inferredDifficulty: null,
      priorityScore: initialPriority,
      lastPriorityCalculationTime: null, // Will be updated by _recalculateAndSavePriority
    };

    await this.tasks.insertOne(newTaskDoc);

    // Effects: Trigger AI-enhanced priority calculation for the new task
    await this._recalculateAndSavePriority(newTaskDoc); // This will update the task in DB and local doc

    return { task: newTaskId };
  }

  /**
   * updateTask (task: Task, newName: String?, newDescription: String?, newDueDate: Time?): (task: Task)
   *
   * **requires** `task` exists. If `newName` is provided, it is non-empty and unique for `task.owner` (excluding the current `task`). If `newDueDate` is provided, it is valid.
   *
   * **effects**
   * The task's properties are updated with any provided new values.
   * If the name is provided, the task's name is changed. If the description is provided, it is updated.
   * If a new due date is provided, the task's due date is changed and the overdue flag is reset.
   * After any updates, the system recalculates the task's priority and returns the updated task.
   */
  async updateTask(
    { task: taskId, newName, newDescription, newDueDate }: {
      task: Task;
      newName?: string;
      newDescription?: string;
      newDueDate?: Date;
    },
  ): Promise<{ task: Task } | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }

    const updateFields: Partial<TaskDocument> = {};
    let shouldRecalculatePriority = false;

    // Requires: newName validation
    if (newName !== undefined) {
      if (newName.trim() === "") {
        return { error: "New task name cannot be empty." };
      }
      if (newName !== taskDoc.name) {
        const existingTask = await this.tasks.findOne({
          owner: taskDoc.owner,
          name: newName,
          _id: { $ne: taskId }, // Exclude the current task from the uniqueness check
        });
        if (existingTask) {
          return { error: `Task with name '${newName}' already exists for this owner.` };
        }
        updateFields.name = newName;
        shouldRecalculatePriority = true; // Name change might affect LLM inference
      }
    }

    if (newDescription !== undefined && newDescription !== taskDoc.description) {
      updateFields.description = newDescription;
      shouldRecalculatePriority = true; // Description change might affect LLM inference
    }

    // Effects: If newDueDate, reset overdue flag
    if (newDueDate !== undefined) {
      if (isNaN(newDueDate.getTime())) {
        return { error: "Invalid new due date. Please provide a valid date/time." };
      }
      if (newDueDate.getTime() !== taskDoc.dueDate.getTime()) {
        updateFields.dueDate = newDueDate;
        updateFields.overdue = false; // Reset overdue status when due date changes
        shouldRecalculatePriority = true; // Due date change definitely affects priority
      }
    }

    if (Object.keys(updateFields).length > 0) {
      // Update the task in the database
      await this.tasks.updateOne({ _id: taskId }, { $set: updateFields });
      // Update the local document to reflect changes before recalculating priority
      Object.assign(taskDoc, updateFields);
    }

    // Effects: Recalculate priority if relevant fields changed
    if (shouldRecalculatePriority) {
      await this._recalculateAndSavePriority(taskDoc);
    }

    return { task: taskId };
  }

  /**
   * snoozeTask (task: Task, newDueDate: Time): (task: Task)
   *
   * **requires** `task` exists and `newDueDate` is in the future relative to the current time.
   *
   * **effects**
   * The task's due date is updated to the new date, and the overdue flag is reset to false.
   * The system recalculates the task's priority to reflect the new deadline and returns the updated task.
   */
  async snoozeTask(
    { task: taskId, newDueDate }: { task: Task; newDueDate: Date },
  ): Promise<{ task: Task } | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Requires: newDueDate is in the future
    const now = new Date();
    if (isNaN(newDueDate.getTime()) || newDueDate.getTime() <= now.getTime()) {
      return { error: "New due date must be in the future to snooze a task." };
    }

    // Effects: Update due date, reset overdue flag
    taskDoc.dueDate = newDueDate;
    taskDoc.overdue = false;

    await this.tasks.updateOne(
      { _id: taskId },
      { $set: { dueDate: newDueDate, overdue: false } },
    );

    // Effects: Recalculate priority to reflect the new deadline
    await this._recalculateAndSavePriority(taskDoc);

    return { task: taskId };
  }

  /**
   * completeTask (task: Task): (task: Task)
   *
   * **requires** `task` exists
   *
   * **effects**
   * The task is marked as completed, and its priority score is set to zero.
   * All AI-inferred attributes (effort hours, importance, and difficulty) are cleared,
   * and the updated task is returned.
   */
  async completeTask(
    { task: taskId }: { task: Task },
  ): Promise<{ task: Task } | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Effects: Mark completed, set priority to 0, clear AI attributes
    taskDoc.completed = true;
    taskDoc.priorityScore = 0;
    taskDoc.inferredEffortHours = null;
    taskDoc.inferredImportance = null;
    taskDoc.inferredDifficulty = null;
    taskDoc.lastPriorityCalculationTime = new Date(); // Update calculation time even for completion

    await this.tasks.updateOne(
      { _id: taskId },
      {
        $set: {
          completed: true,
          priorityScore: 0,
          inferredEffortHours: null,
          inferredImportance: null,
          inferredDifficulty: null,
          lastPriorityCalculationTime: taskDoc.lastPriorityCalculationTime,
        },
      },
    );

    return { task: taskId };
  }

  /**
   * **system** `markOverdue (task: Task)`
   *
   * **requires** `task` exists, `task.completed` is false, `current time > task.dueDate`, and `task.overdue` is false.
   *
   * **effects**
   * The task is marked as overdue, and the system automatically recalculates its priority to reflect the increased urgency.
   * Returns an empty object if the preconditions are not met, indicating no action was necessary.
   */
  async markOverdue(
    { task: taskId }: { task: Task },
  ): Promise<Empty | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Preconditions are firing conditions: if not met, no action occurs.
    const now = new Date();
    if (
      taskDoc.completed || // Task is completed
      now.getTime() <= taskDoc.dueDate.getTime() || // Not yet overdue
      taskDoc.overdue // Already marked overdue
    ) {
      return {}; // No action needed as preconditions are not met
    }

    // Effects: Mark task as overdue
    taskDoc.overdue = true;
    await this.tasks.updateOne({ _id: taskId }, { $set: { overdue: true } });

    // Effects: Recalculate priority to reflect increased urgency
    await this._recalculateAndSavePriority(taskDoc);

    return {};
  }

  /**
   * **system** `calculateTaskPriority (task: Task)`
   *
   * **requires** `task` exists, `task.completed` is false.
   *
   * **effects**
   * The system attempts to use an LLM to infer the task's effort (in hours), importance (1-10),
   * and difficulty (1-10) from its name and description. These attributes are validated.
   * If LLM inference succeeds and validation passes, task's inferred attributes are updated
   * and priority score is calculated combining time urgency with weighted LLM attributes.
   * If LLM inference fails or validation fails, inferred attributes are cleared
   * and priority score is calculated based solely on time urgency.
   * The timestamp of the last priority calculation is recorded.
   * Returns an empty object if the task is completed, indicating no action was necessary.
   */
  async calculateTaskPriority(
    { task: taskId }: { task: Task },
  ): Promise<Empty | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Requires: task.completed is false
    if (taskDoc.completed) {
      return {}; // No need to recalculate priority for completed tasks.
    }

    // Effects: The core logic for calculation and saving is delegated to the helper.
    await this._recalculateAndSavePriority(taskDoc);

    return {};
  }

  // --- Queries ---

  /**
   * _getTask (task: Task) : (task: {id: Task, owner: User, name: String, description: String, dueDate: Time, completed: Flag, overdue: Flag, inferredEffortHours: Number?, inferredImportance: Number?, inferredDifficulty: Number?, priorityScore: Number, lastPriorityCalculationTime: Time?})
   *
   * **requires** `task` exists
   * **effects** returns the full task object wrapped in a 'task' field within an array.
   */
  async _getTask(
    { task: taskId }: { task: Task },
  ): Promise<{ task: TaskDocument }[] | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }
    return [{ task: taskDoc }];
  }

  /**
   * _getTasksByOwner (owner: User) : (task: {id: Task, owner: User, name: String, description: String, dueDate: Time, completed: Flag, overdue: Flag, inferredEffortHours: Number?, inferredImportance: Number?, inferredDifficulty: Number?, priorityScore: Number, lastPriorityCalculationTime: Time?})
   *
   * **requires** owner exists (implicitly, as tasks are linked to owners)
   * **effects** returns a list of all tasks for the given owner, sorted by priorityScore (descending).
   */
  async _getTasksByOwner(
    { owner }: { owner: User },
  ): Promise<{ task: Partial<TaskDocument> }[] | { error: string }> {
    // Note: Assuming 'owner exists' is handled by a separate User concept or implicit by tasks existing.
    const taskDocs = await this.tasks
      .find({ owner })
      .sort({ priorityScore: -1 }) // Sort by highest priority first
      .toArray();

    // Return the full task document as the 'task' field
    return taskDocs.map((doc) => ({
      task: doc,
    }));
  }

  /**
   * _getPrioritizedTasks (owner: User) : (task: {id: Task, name: String, priorityScore: Number, dueDate: Time, overdue: Flag, inferredEffortHours: Number?, inferredImportance: Number?, inferredDifficulty: Number?})
   *
   * **requires** owner exists
   * **effects** returns a list of non-completed tasks for the given owner, sorted by priorityScore (descending),
   *             with a subset of key fields.
   */
  async _getPrioritizedTasks(
    { owner }: { owner: User },
  ): Promise<{ task: Partial<TaskDocument> }[] | { error: string }> {
    const taskDocs = await this.tasks
      .find({ owner, completed: false })
      .sort({ priorityScore: -1 }) // Highest priority first
      .toArray();

    // Return a subset of fields relevant for a prioritized list view
    return taskDocs.map((doc) => ({
      task: {
        id: doc._id,
        name: doc.name,
        priorityScore: doc.priorityScore,
        dueDate: doc.dueDate,
        overdue: doc.overdue,
        inferredEffortHours: doc.inferredEffortHours,
        inferredImportance: doc.inferredImportance,
        inferredDifficulty: doc.inferredDifficulty,
      },
    }));
  }
}
```
