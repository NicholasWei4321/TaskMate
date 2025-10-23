---
timestamp: 'Thu Oct 23 2025 13:06:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_130654.a90c3da1.md]]'
content_id: e66d0a16eb7b2791497c3fd45a3eeab2db61065f9dc7ac186b3246ef9c87523f
---

# file: src/concepts/AIPrioritizedTask/AIPrioritizedTaskConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
// Although we'll use task ID directly as _id, freshID() is generally useful for new concept-internal entities.

// Declare collection prefix, use concept name
const PREFIX = "AIPrioritizedTask" + ".";

// Generic types for this concept, acting as identifiers
type Task = ID;
type User = ID;
type AIModel = ID;
type Priority = number; // Using number for priority

/**
 * Interface for the document stored in the 'prioritizedTasks' MongoDB collection.
 * This represents the state associated with each task being prioritized.
 *
 * a set of PrioritizedTasks with
 *   a task Task (this will be the _id of the document)
 *   a currentPriority Number
 *   a aiAssignedPriority Number
 *   a aiModel AIModel (optional, can be null if no AI priority has been assigned yet)
 *   a lastUpdated Number (timestamp in ms)
 *   a isOverridden Boolean
 *   a overriddenByUser User (optional, present only if isOverridden is true)
 *   a overriddenTimestamp Number (optional, present only if isOverridden is true)
 */
interface PrioritizedTaskDoc {
  _id: Task; // The ID of the task being prioritized (external reference)
  currentPriority: Priority;
  aiAssignedPriority: Priority;
  aiModel: AIModel | null;
  lastUpdated: number; // Timestamp in milliseconds
  isOverridden: boolean;
  overriddenByUser: User | null;
  overriddenTimestamp: number | null;
}

export default class AIPrioritizedTaskConcept {
  private prioritizedTasks: Collection<PrioritizedTaskDoc>;

  constructor(private readonly db: Db) {
    this.prioritizedTasks = this.db.collection(PREFIX + "prioritizedTasks");
    // Ensure indexes for efficient querying and sorting
    // For sorting tasks by priority (descending for higher priority first)
    this.prioritizedTasks.createIndex({ currentPriority: -1 });
    // For fast lookups by task ID (primary key)
    this.prioritizedTasks.createIndex({ _id: 1 }, { unique: true });
    // For efficiently finding all overridden tasks
    this.prioritizedTasks.createIndex({ isOverridden: 1 });
  }

  /**
   * registerTaskForPrioritization (task: Task) : (error: String)
   *
   * **requires** no PrioritizedTask entry for `task` already exists
   *
   * **effects** creates a new PrioritizedTask entry for `task`;
   *             sets `currentPriority` to a default (0);
   *             sets `aiAssignedPriority` to a default (0);
   *             sets `aiModel` to null;
   *             sets `lastUpdated` to current time;
   *             sets `isOverridden` to false;
   *             sets `overriddenByUser` and `overriddenTimestamp` to null.
   */
  async registerTaskForPrioritization(
    { task }: { task: Task },
  ): Promise<Empty | { error: string }> {
    const existing = await this.prioritizedTasks.findOne({ _id: task });
    if (existing) {
      return { error: `Task '${task}' is already registered for prioritization.` };
    }

    const now = Date.now();
    try {
      await this.prioritizedTasks.insertOne({
        _id: task,
        currentPriority: 0, // Default priority
        aiAssignedPriority: 0, // Default AI priority
        aiModel: null,
        lastUpdated: now,
        isOverridden: false,
        overriddenByUser: null,
        overriddenTimestamp: null,
      });
      return {};
    } catch (e) {
      console.error("Error registering task for prioritization:", e);
      return { error: "Failed to register task for prioritization." };
    }
  }

  /**
   * assignAIPriority (task: Task, aiModel: AIModel, priority: Number) : (error: String)
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *             AND the task is NOT currently overridden by a user
   *
   * **effects** updates the `aiAssignedPriority` of `task` to `priority`;
   *             updates the `aiModel` to `aiModel`;
   *             updates `currentPriority` to `priority`;
   *             updates `lastUpdated` to current time.
   */
  async assignAIPriority(
    { task, aiModel, priority }: { task: Task; aiModel: AIModel; priority: Priority },
  ): Promise<Empty | { error: string }> {
    const existing = await this.prioritizedTasks.findOne({ _id: task });
    if (!existing) {
      return { error: `Task '${task}' not found for prioritization.` };
    }
    if (existing.isOverridden) {
      return {
        error: `Task '${task}' is currently overridden by a user and cannot be AI-assigned.`,
      };
    }

    const now = Date.now();
    try {
      await this.prioritizedTasks.updateOne(
        { _id: task },
        {
          $set: {
            aiAssignedPriority: priority,
            aiModel: aiModel,
            currentPriority: priority, // `currentPriority` follows AI if not overridden
            lastUpdated: now,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error assigning AI priority:", e);
      return { error: "Failed to assign AI priority." };
    }
  }

  /**
   * updateAIPriority (task: Task, aiModel: AIModel, newPriority: Number) : (error: String)
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *             AND the task is NOT currently overridden by a user
   *             AND the `aiModel` matches the existing `aiModel` for the task (or existing `aiModel` is null)
   *
   * **effects** updates the `aiAssignedPriority` of `task` to `newPriority`;
   *             updates the `aiModel` to `aiModel`;
   *             updates `currentPriority` to `newPriority`;
   *             updates `lastUpdated` to current time.
   */
  async updateAIPriority(
    { task, aiModel, newPriority }: { task: Task; aiModel: AIModel; newPriority: Priority },
  ): Promise<Empty | { error: string }> {
    const existing = await this.prioritizedTasks.findOne({ _id: task });
    if (!existing) {
      return { error: `Task '${task}' not found for prioritization.` };
    }
    if (existing.isOverridden) {
      return {
        error: `Task '${task}' is currently overridden by a user and cannot be AI-updated.`,
      };
    }
    // Check if the AI model matches the one that originally set the priority (if any)
    if (existing.aiModel !== null && existing.aiModel !== aiModel) {
      return {
        error:
          `Cannot update AI priority for task '${task}'. Provided AI model '${aiModel}' does not match existing AI model '${existing.aiModel}'.`,
      };
    }

    const now = Date.now();
    try {
      await this.prioritizedTasks.updateOne(
        { _id: task },
        {
          $set: {
            aiAssignedPriority: newPriority,
            aiModel: aiModel,
            currentPriority: newPriority, // `currentPriority` follows AI if not overridden
            lastUpdated: now,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error updating AI priority:", e);
      return { error: "Failed to update AI priority." };
    }
  }

  /**
   * overridePriority (task: Task, user: User, newPriority: Number) : (error: String)
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *
   * **effects** sets `currentPriority` of `task` to `newPriority`;
   *             sets `isOverridden` to true;
   *             sets `overriddenByUser` to `user`;
   *             sets `overriddenTimestamp` to current time;
   *             updates `lastUpdated` to current time.
   */
  async overridePriority(
    { task, user, newPriority }: { task: Task; user: User; newPriority: Priority },
  ): Promise<Empty | { error: string }> {
    const existing = await this.prioritizedTasks.findOne({ _id: task });
    if (!existing) {
      return { error: `Task '${task}' not found for prioritization.` };
    }

    const now = Date.now();
    try {
      await this.prioritizedTasks.updateOne(
        { _id: task },
        {
          $set: {
            currentPriority: newPriority,
            isOverridden: true,
            overriddenByUser: user,
            overriddenTimestamp: now,
            lastUpdated: now,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error overriding priority:", e);
      return { error: "Failed to override priority." };
    }
  }

  /**
   * clearOverride (task: Task) : (error: String)
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *             AND `isOverridden` is true for `task`
   *
   * **effects** sets `currentPriority` of `task` back to its `aiAssignedPriority`;
   *             sets `isOverridden` to false;
   *             sets `overriddenByUser` and `overriddenTimestamp` to null;
   *             updates `lastUpdated` to current time.
   */
  async clearOverride(
    { task }: { task: Task },
  ): Promise<Empty | { error: string }> {
    const existing = await this.prioritizedTasks.findOne({ _id: task });
    if (!existing) {
      return { error: `Task '${task}' not found for prioritization.` };
    }
    if (!existing.isOverridden) {
      return { error: `Task '${task}' is not currently overridden.` };
    }

    const now = Date.now();
    try {
      await this.prioritizedTasks.updateOne(
        { _id: task },
        {
          $set: {
            currentPriority: existing.aiAssignedPriority, // Revert to AI assigned priority
            isOverridden: false,
            overriddenByUser: null,
            overriddenTimestamp: null,
            lastUpdated: now,
          },
        },
      );
      return {};
    } catch (e) {
      console.error("Error clearing override:", e);
      return { error: "Failed to clear override." };
    }
  }

  /**
   * removeTaskFromPrioritization (task: Task) : (error: String)
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *
   * **effects** deletes the PrioritizedTask entry for `task`.
   */
  async removeTaskFromPrioritization(
    { task }: { task: Task },
  ): Promise<Empty | { error: string }> {
    const result = await this.prioritizedTasks.deleteOne({ _id: task });
    if (result.deletedCount === 0) {
      return { error: `Task '${task}' not found for prioritization, cannot remove.` };
    }
    return {};
  }

  // --- Queries ---

  /**
   * _getTaskPriority (task: Task) : (priority: Number, aiPriority: Number, aiModel: AIModel, lastUpdated: Number, isOverridden: Boolean, overriddenByUser: User, overriddenTimestamp: Number)[]
   *
   * **requires** a PrioritizedTask entry for `task` exists
   *
   * **effects** returns the details of the priority for `task`.
   */
  async _getTaskPriority(
    { task }: { task: Task },
  ): Promise<
    {
      priority: Priority;
      aiPriority: Priority;
      aiModel: AIModel | null;
      lastUpdated: number;
      isOverridden: boolean;
      overriddenByUser: User | null;
      overriddenTimestamp: number | null;
    }[] | { error: string }
  > {
    const doc = await this.prioritizedTasks.findOne({ _id: task });
    if (!doc) {
      return { error: `Task '${task}' not found.` };
    }
    return [{
      priority: doc.currentPriority,
      aiPriority: doc.aiAssignedPriority,
      aiModel: doc.aiModel,
      lastUpdated: doc.lastUpdated,
      isOverridden: doc.isOverridden,
      overriddenByUser: doc.overriddenByUser,
      overriddenTimestamp: doc.overriddenTimestamp,
    }];
  }

  /**
   * _getPrioritizedTasks (limit: Number, offset: Number) : (task: Task, priority: Number)[]
   *
   * **requires** true
   *
   * **effects** returns a list of tasks and their current priorities, sorted by `currentPriority` (descending), limited by `limit` and offset by `offset`.
   */
  async _getPrioritizedTasks(
    { limit = 10, offset = 0 }: { limit?: number; offset?: number },
  ): Promise<{ task: Task; priority: Priority }[] | { error: string }> {
    if (limit < 0 || offset < 0) {
      return { error: "Limit and offset must be non-negative." };
    }
    try {
      const tasks = await this.prioritizedTasks.find({})
        .sort({ currentPriority: -1 }) // Sort by priority descending
        .skip(offset)
        .limit(limit)
        .project({ _id: 1, currentPriority: 1 }) // Only fetch necessary fields
        .toArray();

      return tasks.map((doc) => ({
        task: doc._id,
        priority: doc.currentPriority,
      }));
    } catch (e) {
      console.error("Error getting prioritized tasks:", e);
      return { error: "Failed to retrieve prioritized tasks." };
    }
  }

  /**
   * _getOverriddenTasks () : (task: Task, priority: Number, overriddenByUser: User)[]
   *
   * **requires** true
   *
   * **effects** returns a list of tasks that have been manually overridden, along with their current priority and the user who overrode it.
   */
  async _getOverriddenTasks(
    _args: Empty = {}, // No arguments, but needs to be an object for consistency
  ): Promise<{ task: Task; priority: Priority; overriddenByUser: User }[] | { error: string }> {
    try {
      const tasks = await this.prioritizedTasks.find({ isOverridden: true })
        .project({ _id: 1, currentPriority: 1, overriddenByUser: 1 })
        .toArray();

      // Filter out any potential docs where overriddenByUser might somehow be null despite isOverridden: true
      return tasks.filter((doc) => doc.overriddenByUser !== null).map((doc) => ({
        task: doc._id,
        priority: doc.currentPriority,
        overriddenByUser: doc.overriddenByUser!, // Assert non-null after filtering
      }));
    } catch (e) {
      console.error("Error getting overridden tasks:", e);
      return { error: "Failed to retrieve overridden tasks." };
    }
  }
}
```
