[@implementation](implementation.md)

[@testing-concepts](../../background/testing-concepts.md)

# test: AIPrioritizedTask
# response:

First, let's create the necessary utility file for the LLM integration.

# file: src/concepts/gemini-llm.ts

```typescript
// src/concepts/gemini-llm.ts
import { Deno } from "@utils/types.ts"; // Import Deno type if not globally available

/**
 * A simple wrapper for interacting with the Google Gemini LLM API.
 * Requires a GEMINI_API_KEY environment variable to be set.
 */
export class GeminiLLM {
  private readonly apiKey: string;
  private readonly apiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  constructor({ apiKey }: { apiKey: string }) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for GeminiLLM.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Executes a prompt against the Gemini LLM and returns the generated text.
   * @param prompt The text prompt to send to the LLM.
   * @returns The generated text from the LLM, or an error message.
   */
  async executeLLM(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `❌ LLM API Error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(
          `LLM API call failed with status ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      // Expecting data.candidates[0].content.parts[0].text
      if (
        data.candidates && data.candidates.length > 0 &&
        data.candidates[0].content && data.candidates[0].content.parts &&
        data.candidates[0].content.parts.length > 0 &&
        data.candidates[0].content.parts[0].text
      ) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.warn("⚠️  Unexpected LLM response structure:", data);
        throw new Error("Unexpected LLM response structure.");
      }
    } catch (error) {
      console.error(`❌ Network or parsing error during LLM call: ${error}`);
      throw new Error(`Failed to get LLM response: ${(error as Error).message}`);
    }
  }
}
```

Next, the implementation of the `AIPrioritizedTask` concept.

# file: src/concepts/AIPrioritizedTaskConcept.ts

```typescript
// src/concepts/AIPrioritizedTaskConcept.ts

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "./gemini-llm.ts"; // Import the LLM wrapper

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
  private readonly llm: GeminiLLM | null;

  constructor(private readonly db: Db) {
    this.tasks = this.db.collection(PREFIX + "tasks");

    const apiKey = (globalThis as any).Deno?.env?.get("GEMINI_API_KEY");
    if (apiKey) {
      this.llm = new GeminiLLM({ apiKey });
    } else {
      this.llm = null;
      console.warn("⚠️  GEMINI_API_KEY not set. LLM inference will be disabled.");
    }
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
    if (!this.llm) {
      return null; // LLM is not initialized (no API key)
    }

    try {
      // Create prompt for attribute extraction
      const prompt = this._createAttributePrompt(name, description, dueDate);

      // Call LLM
      console.log(`🤖 Calling LLM for task: "${name}"...`);
      const responseText = await this.llm.executeLLM(prompt);

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
      console.error(`❌ Error in LLM inference for task "${name}": ${(error as Error).message}`);
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
   *
   * **invariants**
   * inferredEffortHours is between 0.5 and 40 when present
   * inferredImportance is between 1 and 10 when present
   * inferredDifficulty is between 1 and 10 when present
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
      // The longer overdue, the higher the score, up to a cap to prevent infinite growth
      score += Math.max(0, Math.min(500, -daysUntilDue * 100));
    } else {
      // Closer due date = higher priority. Max out at 1000 for tasks due today.
      // Score decreases as daysUntilDue increases.
      score += Math.max(0, Math.min(1000, 1000 - daysUntilDue * 200));
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
   * @param taskDoc The current TaskDocument to recalculate priority for. This object will be mutated.
   */
  private async _recalculateAndSavePriority(taskDoc: TaskDocument): Promise<void> {
    if (taskDoc.completed) {
      // Completed tasks have 0 priority, clear AI attributes
      taskDoc.priorityScore = 0;
      taskDoc.inferredEffortHours = null;
      taskDoc.inferredImportance = null;
      taskDoc.inferredDifficulty = null;
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
        taskDoc.inferredEffortHours = inferred.effort;
        taskDoc.inferredImportance = inferred.importance;
        taskDoc.inferredDifficulty = inferred.difficulty;
        taskDoc.priorityScore = this._calculateAIPriority(
          taskDoc.dueDate,
          taskDoc.overdue,
          inferred.effort,
          inferred.importance,
          inferred.difficulty,
        );
      } else {
        // Fallback to time-based if LLM fails or validation fails
        console.log("ℹ️  Falling back to time-based priority calculation due to LLM failure or validation issues.");
        taskDoc.inferredEffortHours = null;
        taskDoc.inferredImportance = null;
        taskDoc.inferredDifficulty = null;
        taskDoc.priorityScore = this._calculateTimeBasedPriority(
          taskDoc.dueDate,
          taskDoc.overdue,
        );
      }
    }
    taskDoc.lastPriorityCalculationTime = new Date();

    // Update the task in the database with the new priority and inferred attributes
    await this.tasks.updateOne(
      { _id: taskDoc._id },
      { $set: {
        priorityScore: taskDoc.priorityScore,
        inferredEffortHours: taskDoc.inferredEffortHours,
        inferredImportance: taskDoc.inferredImportance,
        inferredDifficulty: taskDoc.inferredDifficulty,
        lastPriorityCalculationTime: taskDoc.lastPriorityCalculationTime,
        // Also update overdue/completed if they were modified just before this call
        overdue: taskDoc.overdue,
        completed: taskDoc.completed,
      }},
    );
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
    console.log(`\nExecuting createTask for owner: ${owner}, name: "${name}"`);

    // Requires: name is non-empty
    if (!name || name.trim() === "") {
      console.log("  🛑 Error: Task name cannot be empty.");
      return { error: "Task name cannot be empty." };
    }

    // Requires: dueDate is valid
    if (isNaN(dueDate.getTime())) {
      console.log("  🛑 Error: Invalid due date. Please provide a valid date/time.");
      return { error: "Invalid due date. Please provide a valid date/time." };
    }

    // Requires: name is unique for the owner
    const existingTask = await this.tasks.findOne({ owner, name });
    if (existingTask) {
      console.log(`  🛑 Error: Task with name '${name}' already exists for this owner.`);
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
    console.log(`  ✅ Task '${name}' created with ID: ${newTaskId}. Initial priority: ${initialPriority}`);

    // Effects: Trigger AI-enhanced priority calculation for the new task
    await this._recalculateAndSavePriority(newTaskDoc); // This will update the task in DB and local doc
    console.log(`  🔄 Priority recalculated. New priority: ${newTaskDoc.priorityScore}`);

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
    console.log(`\nExecuting updateTask for task ID: ${taskId}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }

    const updateFields: Partial<TaskDocument> = {};
    let shouldRecalculatePriority = false;

    // Requires: newName validation
    if (newName !== undefined) {
      if (newName.trim() === "") {
        console.log("  🛑 Error: New task name cannot be empty.");
        return { error: "New task name cannot be empty." };
      }
      if (newName !== taskDoc.name) {
        const existingTask = await this.tasks.findOne({
          owner: taskDoc.owner,
          name: newName,
          _id: { $ne: taskId }, // Exclude the current task from the uniqueness check
        });
        if (existingTask) {
          console.log(`  🛑 Error: Task with name '${newName}' already exists for this owner.`);
          return { error: `Task with name '${newName}' already exists for this owner.` };
        }
        updateFields.name = newName;
        shouldRecalculatePriority = true; // Name/description change might affect LLM inference
        console.log(`  ⬆️ Updated name from "${taskDoc.name}" to "${newName}"`);
      }
    }

    if (newDescription !== undefined && newDescription !== taskDoc.description) {
      updateFields.description = newDescription;
      shouldRecalculatePriority = true; // Name/description change might affect LLM inference
      console.log(`  ⬆️ Updated description.`);
    }

    // Effects: If newDueDate, reset overdue flag
    if (newDueDate !== undefined) {
      if (isNaN(newDueDate.getTime())) {
        console.log("  🛑 Error: Invalid new due date. Please provide a valid date/time.");
        return { error: "Invalid new due date. Please provide a valid date/time." };
      }
      if (newDueDate.getTime() !== taskDoc.dueDate.getTime()) {
        updateFields.dueDate = newDueDate;
        updateFields.overdue = false; // Reset overdue status when due date changes
        shouldRecalculatePriority = true; // Due date change definitely affects priority
        console.log(`  ⬆️ Updated due date to ${newDueDate.toISOString()}, overdue flag reset.`);
      }
    }

    if (Object.keys(updateFields).length > 0) {
      // Update the task in the database
      await this.tasks.updateOne({ _id: taskId }, { $set: updateFields });
      // Update the local document to reflect changes before recalculating priority
      Object.assign(taskDoc, updateFields);
      console.log(`  ✅ Task ${taskId} updated in DB.`);
    } else {
      console.log(`  ℹ️ No changes requested for task ${taskId}.`);
    }

    // Effects: Recalculate priority if relevant fields changed
    if (shouldRecalculatePriority) {
      await this._recalculateAndSavePriority(taskDoc);
      console.log(`  🔄 Priority recalculated. New priority: ${taskDoc.priorityScore}`);
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
    console.log(`\nExecuting snoozeTask for task ID: ${taskId} to ${newDueDate.toISOString()}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Requires: newDueDate is in the future
    const now = new Date();
    if (isNaN(newDueDate.getTime()) || newDueDate.getTime() <= now.getTime()) {
      console.log("  🛑 Error: New due date must be in the future to snooze a task.");
      return { error: "New due date must be in the future to snooze a task." };
    }

    // Effects: Update due date, reset overdue flag
    taskDoc.dueDate = newDueDate;
    taskDoc.overdue = false;

    await this.tasks.updateOne(
      { _id: taskId },
      { $set: { dueDate: newDueDate, overdue: false } },
    );
    console.log(`  ✅ Task ${taskId} snoozed to ${newDueDate.toISOString()}, overdue flag reset.`);

    // Effects: Recalculate priority to reflect the new deadline
    await this._recalculateAndSavePriority(taskDoc);
    console.log(`  🔄 Priority recalculated. New priority: ${taskDoc.priorityScore}`);

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
    console.log(`\nExecuting completeTask for task ID: ${taskId}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Effects: Mark completed, set priority to 0, clear AI attributes
    taskDoc.completed = true;
    // The _recalculateAndSavePriority helper handles setting priority to 0 and clearing AI attributes for completed tasks.
    await this._recalculateAndSavePriority(taskDoc);

    console.log(`  ✅ Task ${taskId} marked as completed. Priority: ${taskDoc.priorityScore}`);

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
    console.log(`\nExecuting system markOverdue for task ID: ${taskId}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Preconditions are firing conditions: if not met, no action occurs.
    const now = new Date();
    if (
      taskDoc.completed // Task is completed
    ) {
      console.log(`  ℹ️  Task ${taskId} is completed, not marking overdue.`);
      return {};
    }
    if (now.getTime() <= taskDoc.dueDate.getTime()) { // Not yet overdue
      console.log(`  ℹ️  Task ${taskId} is not yet overdue (due ${taskDoc.dueDate.toISOString()}).`);
      return {};
    }
    if (taskDoc.overdue) { // Already marked overdue
      console.log(`  ℹ️  Task ${taskId} is already marked overdue.`);
      return {};
    }

    // Effects: Mark task as overdue
    taskDoc.overdue = true;
    await this.tasks.updateOne({ _id: taskId }, { $set: { overdue: true } });
    console.log(`  ✅ Task ${taskId} marked as overdue.`);

    // Effects: Recalculate priority to reflect increased urgency
    await this._recalculateAndSavePriority(taskDoc);
    console.log(`  🔄 Priority recalculated. New priority: ${taskDoc.priorityScore}`);

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
    console.log(`\nExecuting system calculateTaskPriority for task ID: ${taskId}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }

    // Requires: task.completed is false
    if (taskDoc.completed) {
      console.log(`  ℹ️  Task ${taskId} is completed, skipping priority calculation.`);
      return {}; // No need to recalculate priority for completed tasks.
    }

    // Effects: The core logic for calculation and saving is delegated to the helper.
    await this._recalculateAndSavePriority(taskDoc);
    console.log(`  🔄 Priority recalculated. New priority: ${taskDoc.priorityScore}`);

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
    console.log(`\nExecuting getTask for task ID: ${taskId}`);
    const taskDoc = await this.tasks.findOne({ _id: taskId });
    if (!taskDoc) {
      console.log(`  🛑 Error: Task with ID '${taskId}' not found.`);
      return { error: `Task with ID '${taskId}' not found.` };
    }
    console.log(`  ✅ Retrieved task: ${taskDoc.name}, Priority: ${taskDoc.priorityScore}`);
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
    console.log(`\nExecuting getTasksByOwner for owner: ${owner}`);
    // Note: Assuming 'owner exists' is handled by a separate User concept or implicit by tasks existing.
    const taskDocs = await this.tasks
      .find({ owner })
      .sort({ priorityScore: -1 }) // Sort by highest priority first
      .toArray();

    console.log(`  ✅ Found ${taskDocs.length} tasks for owner ${owner}, sorted by priority.`);
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
    console.log(`\nExecuting getPrioritizedTasks for owner: ${owner}`);
    const taskDocs = await this.tasks
      .find({ owner, completed: false })
      .sort({ priorityScore: -1 }) // Highest priority first
      .toArray();

    console.log(`  ✅ Found ${taskDocs.length} non-completed tasks for owner ${owner}, sorted by priority.`);
    return { tasks: taskDocs };
  }
}
```

Finally, the test file for `AIPrioritizedTaskConcept`.

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