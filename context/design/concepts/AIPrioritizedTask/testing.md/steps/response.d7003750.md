---
timestamp: 'Thu Oct 23 2025 15:56:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_155620.1e2a1c1e.md]]'
content_id: d70037500b327f221261381607028d42343a7a29756798c1f08367d783c71e9c
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
   * Call LLM to infer task attributes (effort, importance, difficulty)
   * Returns null if LLM call fails or response cannot be parsed
   */
  private async _triggerLLMInference(name: string, description: string, dueDate: Date): Promise<{
    effort: number;
    importance: number;
    difficulty: number;
  } | null> {
    try {
      // Get API key from environment
      const apiKey = (globalThis as any).Deno?.env?.get("GEMINI_API_KEY");
      if (!apiKey) {
        console.warn("⚠️  GEMINI_API_KEY not set, skipping LLM inference");
        return null;
      }

      // Initialize Gemini LLM
      const { GeminiLLM } = await import("./gemini-llm.ts");
      const llm = new GeminiLLM({ apiKey });

      // Create prompt for attribute extraction
      const prompt = this._createAttributePrompt(name, description, dueDate);

      // Call LLM
      console.log(`🤖 Calling LLM for task: "${name}"...`);
      const responseText = await llm.executeLLM(prompt);

      console.log('\n🤖 RAW GEMINI RESPONSE');
      console.log('======================');
      console.log(responseText);
      console.log('======================\n');

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️  No JSON found in LLM response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Check that all required fields are present and are numbers
      if (
        typeof parsed.effort !== 'number' ||
        typeof parsed.importance !== 'number' ||
        typeof parsed.difficulty !== 'number'
      ) {
        console.warn('⚠️  LLM response missing required fields or fields are not numbers');
        return null;
      }

      return {
        effort: parsed.effort,
        importance: parsed.importance,
        difficulty: parsed.difficulty
      };

    } catch (error) {
      console.error(`❌ Error in LLM inference: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Create prompt for LLM to extract task attributes
   */
  private _createAttributePrompt(name: string, description: string, dueDate: Date): string {
    return `
You are a helpful AI assistant that analyzes task descriptions to estimate their attributes.

TASK INFORMATION:
- Name: ${name}
- Description: ${description}
- Due Date: ${dueDate.toISOString()}

Your job is to estimate three attributes based on the task description:

1. EFFORT: Estimated hours needed to complete this task (range: 0.5 to 40 hours)
   - Quick tasks (emails, small edits): 0.5-2 hours
   - Medium tasks (assignments, meetings prep): 2-8 hours
   - Large tasks (projects, papers, studying for exams): 8-40 hours

2. IMPORTANCE: How important this task is (scale: 1-10)
   - 1-3: Low importance (optional, nice-to-have)
   - 4-7: Medium importance (should do, has some consequences)
   - 8-10: High importance (critical, major consequences if not done)

3. DIFFICULTY: How challenging this task is (scale: 1-10)
   - 1-3: Easy (routine, familiar)
   - 4-7: Medium (requires focus, some problem-solving)
   - 8-10: Hard (complex, unfamiliar, requires significant mental effort)

CRITICAL REQUIREMENTS:
1. Return ONLY valid numeric values within the specified ranges
2. Base your estimates on the task name and description only
3. Be realistic - most tasks are 1-10 hours, importance 4-8, difficulty 3-7
4. Consider keywords like "urgent", "critical", "exam", "project", "review" when estimating

Return your response as a JSON object with this exact structure:
{
  "effort": <number between 0.5 and 40>,
  "importance": <number between 1 and 10>,
  "difficulty": <number between 1 and 10>
}

Return ONLY the JSON object, no additional text or explanation.`;
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
   * Formula: timeBasedScore + (importance × 50) + (difficulty × 30) + (1/effort × 100)
   * Inverse effort weighting prioritizes quick wins.
   */
  private _calculateAIPriority(
    dueDate: Date,
    overdue: boolean,
    effortHours: number,
    importance: number,
    difficulty: number,
  ): number {
    const timeBasedScore = this._calculateTimeBasedPriority(dueDate, overdue);

    // Weights from specification
    const importanceWeight = 50;  // High importance impact
    const difficultyWeight = 30;  // Moderate difficulty impact
    const effortWeight = 100;     // Inverse effort to prioritize quick wins

    const aiScoreComponent = (importance * importanceWeight) +
      (difficulty * difficultyWeight) +
      ((1 / effortHours) * effortWeight); // Inverse effort

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
      const inferred = await this._triggerLLMInference(taskDoc.name, taskDoc.description, taskDoc.dueDate);

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
   * getTask (task: Task) : (taskData: TaskDocument)
   *
   * **requires** `task` exists
   * **effects** returns the full task object with all fields.
   */
  async getTask(
    { task: taskId }: { task: Task },
  ): Promise<{ taskData: TaskDocument } | { error: string }> {
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      return { error: `Task with ID '${taskId}' not found.` };
    }
    return { taskData: taskDoc };
  }

  /**
   * getTasksByOwner (owner: User) : (tasks: set of TaskDocument)
   *
   * **requires** owner exists (implicitly, as tasks are linked to owners)
   * **effects** returns all tasks for the given owner, sorted by priorityScore (descending).
   */
  async getTasksByOwner(
    { owner }: { owner: User },
  ): Promise<{ tasks: TaskDocument[] }> {
    // Note: Assuming 'owner exists' is handled by a separate User concept or implicit by tasks existing.
    const taskDocs = await this.tasks
      .find({ owner })
      .sort({ priorityScore: -1 }) // Sort by highest priority first
      .toArray();

    return { tasks: taskDocs };
  }

  /**
   * getPrioritizedTasks (owner: User) : (tasks: set of TaskDocument)
   *
   * **requires** owner exists
   * **effects** returns all non-completed tasks for the given owner, sorted by priorityScore (descending).
   */
  async getPrioritizedTasks(
    { owner }: { owner: User },
  ): Promise<{ tasks: TaskDocument[] }> {
    const taskDocs = await this.tasks
      .find({ owner, completed: false })
      .sort({ priorityScore: -1 }) // Highest priority first
      .toArray();

    return { tasks: taskDocs };
  }
}
```
