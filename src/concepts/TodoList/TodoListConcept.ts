// src/concepts/TodoList/TodoListConcept.ts
// Concept implementation for organizing items into time-scoped collections

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix using the concept name
const PREFIX = "TodoList" + ".";

// Generic types for the concept
type User = ID; // The ID of a user, treated polymorphically
type Item = ID; // The ID of an item (e.g., a task), treated polymorphically
type List = ID; // The ID of a TodoList instance

// Enum for recurrence types as defined in the concept specification
type RecurrenceType = "none" | "daily" | "weekly" | "monthly";

// Type alias for time, using Date objects for consistency with MongoDB
type Time = Date;

/**
 * ListItem represents an item within a TodoList.
 * It encapsulates the generic Item ID, its completion status, and an optional due date.
 * This structure allows the TodoList concept to manage item-specific properties.
 */
interface ListItem {
  id: Item;
  completed: boolean;
  dueDate?: Time;
}

/**
 * Interface for the 'Lists' collection document, representing a single TodoList.
 * This maps directly to the "a set of Lists" part of the concept's state.
 */
interface ListDocument {
  _id: List;
  name: string;
  owner: User;
  items: ListItem[]; // Now a set of ListItem objects
  startTime: Time; // Always present; defaults to MIN_DATE if not specified
  endTime: Time; // Always present; defaults to MAX_DATE if not specified
  autoClearCompleted: boolean;
  recurrenceType: RecurrenceType;
}

// Invariants:
// each list name is unique per owner (enforced in createList)
// if startTime and endTime are both set, startTime must be before or equal to endTime (enforced in createList and updateListSettings)
// if recurrenceType is not none, both startTime and endTime must be set (enforced in createList and updateListSettings)

// Helper functions for date arithmetic used in recurring list calculations
// These functions create new Date objects without mutating the original

function addDays(date: Time, days: number): Time {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

function addWeeks(date: Time, weeks: number): Time {
  return addDays(date, weeks * 7);
}

function addMonths(date: Time, months: number): Time {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * TodoListConcept is a reusable unit of user-facing functionality
 * that enables users to organize items into named, time-scoped collections
 * with automatic lifecycle management.
 *
 * **purpose** Enable users to organize items into named, time-scoped collections
 * with automatic lifecycle management including clearing completed items
 * and recurring list recreation
 *
 * **principle** If a user creates a named list with a time range and adds several items to it,
 * they can later retrieve that list by its name and see all the items they added.
 * Items can only be added if they fall within the list's time scope.
 * Lists can automatically clear completed items at the end of their time period,
 * and recurring lists automatically recreate themselves for the next time period.
 */
export default class TodoListConcept {
  // MongoDB collection for storing list documents
  lists: Collection<ListDocument>;

  // Default date constants for lists without explicit time ranges
  // These allow lists to be "always active" when no time boundaries are specified
  private static readonly MIN_DATE = new Date(0); // Unix epoch: January 1, 1970 00:00:00 UTC
  private static readonly MAX_DATE = new Date('9999-12-31T23:59:59.999Z'); // December 31, 9999 23:59:59.999 UTC

  constructor(private readonly db: Db) {
    this.lists = this.db.collection(PREFIX + "lists");
  }

  // Helper method to check if dates are defaults (not explicitly set)
  private hasDefaultDates(list: ListDocument): boolean {
    return list.startTime.getTime() === TodoListConcept.MIN_DATE.getTime() &&
           list.endTime.getTime() === TodoListConcept.MAX_DATE.getTime();
  }

  // --- Actions ---

  /**
   * createList (owner: User, name: String, startTime: Time?, endTime: Time?, autoClearCompleted: Boolean, recurrenceType: RecurrenceType): (list: List)
   *
   * **requires**
   * name is non-empty
   * for all existing L in Lists, if L.owner == owner then L.name != name
   * if both startTime and endTime are provided, startTime <= endTime
   * if recurrenceType is not none, both startTime and endTime must be provided
   *
   * **effects**
   * A new list is created with the provided name, owner, and settings.
   * If time boundaries are provided, the list is scoped to that time range.
   * The autoClearCompleted flag determines whether completed items are automatically cleared.
   * The recurrenceType determines if and how the list recreates itself.
   * The list starts with an empty set of items and is returned.
   */
  async createList(
    {
      owner,
      name,
      startTime,
      endTime,
      autoClearCompleted,
      recurrenceType,
    }: {
      owner: User;
      name: string;
      startTime?: Time;
      endTime?: Time;
      autoClearCompleted: boolean;
      recurrenceType: RecurrenceType;
    },
  ): Promise<{ list: List } | { error: string }> {
    // Requires: name is non-empty
    if (!name || name.trim() === "") {
      return { error: "List name cannot be empty." };
    }

    // Requires: for all existing L in Lists, if L.owner == owner then L.name != name
    const existingList = await this.lists.findOne({ owner, name });
    if (existingList) {
      return { error: "A list with this name already exists for this user." };
    }

    // Requires: if both startTime and endTime are provided, startTime <= endTime
    if (startTime && endTime && startTime > endTime) {
      return { error: "Start time cannot be after end time." };
    }

    // Requires: if recurrenceType is not none, both startTime and endTime must be provided
    if (recurrenceType !== "none" && (!startTime || !endTime)) {
      return {
        error:
          "For recurring lists, both start time and end time must be provided.",
      };
    }

    // Effects: Create and insert new list
    // If no time range provided, use min/max dates to represent "always active"
    const newList: ListDocument = {
      _id: freshID() as List, // Generate a fresh ID for the new list
      name,
      owner,
      items: [], // New list starts with an empty set of items
      startTime: startTime || TodoListConcept.MIN_DATE,
      endTime: endTime || TodoListConcept.MAX_DATE,
      autoClearCompleted,
      recurrenceType,
    };

    await this.lists.insertOne(newList);
    return { list: newList._id }; // Return the ID of the newly created list
  }

  /**
   * addListItem (list: List, item: Item, itemDueDate: Time?)
   *
   * **requires**
   * list exists
   * item is not already in list.items (by ListItem.id)
   * if list has startTime and itemDueDate is provided, itemDueDate >= list.startTime
   * if list has endTime and itemDueDate is provided, itemDueDate <= list.endTime
   *
   * **effects**
   * The item is added to the list's set of items.
   * If the list has time constraints and the item has a due date,
   * the item is only added if it falls within the list's time range.
   */
  async addListItem(
    { list, item, itemDueDate }: { list: List; item: Item; itemDueDate?: Time },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Requires: item is not already in list.items
    if (existingList.items.some((i) => i.id === item)) {
      return { error: `Item with ID '${item}' already exists in list '${list}'.` };
    }

    // Requires: Check itemDueDate against list's time range
    if (itemDueDate) {
      // Convert itemDueDate to Date if it's a string
      const dueDateObj = itemDueDate instanceof Date ? itemDueDate : new Date(itemDueDate);

      // Convert list times to Date objects if they're strings
      const listStartTime = existingList.startTime instanceof Date ? existingList.startTime : new Date(existingList.startTime);
      const listEndTime = existingList.endTime instanceof Date ? existingList.endTime : new Date(existingList.endTime);

      if (existingList.startTime && dueDateObj < listStartTime) {
        return {
          error:
            `Item due date '${dueDateObj.toISOString()}' is before the list's start time '${listStartTime.toISOString()}'.`,
        };
      }
      if (existingList.endTime && dueDateObj > listEndTime) {
        return {
          error:
            `Item due date '${dueDateObj.toISOString()}' is after the list's end time '${listEndTime.toISOString()}'.`,
        };
      }
    }

    // Effects: Add the new item to the list
    const newListItem: ListItem = {
      id: item,
      completed: false, // Items are added as uncompleted by default
      dueDate: itemDueDate,
    };

    await this.lists.updateOne(
      { _id: list },
      { $push: { items: newListItem } }, // Atomically push the new item
    );

    return {};
  }

  /**
   * removeListItem (list: List, item: Item)
   *
   * **requires** list exists AND item is in list.items (by ListItem.id)
   *
   * **effects**
   * The item is removed from the list's set of items.
   */
  async removeListItem(
    { list, item }: { list: List; item: Item },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Requires: item is in list.items
    if (!existingList.items.some((i) => i.id === item)) {
      return { error: `Item with ID '${item}' not found in list '${list}'.` };
    }

    // Effects: Remove the item from the list
    await this.lists.updateOne(
      { _id: list },
      { $pull: { "items": { id: item } } }, // Remove the ListItem object by its 'id' field
    );

    return {};
  }

  /**
   * deleteList (list: List)
   *
   * **requires** list exists AND list is not a default system list
   *
   * **effects**
   * The list is removed from the set of all lists.
   */
  async deleteList(
    { list }: { list: List },
  ): Promise<Empty | { error: string }> {
    // Check if the list exists first
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Prevent deletion of default system lists
    const defaultListNames = ['Daily To-dos', 'Weekly To-dos', 'Monthly To-dos'];
    if (defaultListNames.includes(existingList.name)) {
      return { error: `Cannot delete default system list '${existingList.name}'.` };
    }

    // Effects: Delete the list document
    const result = await this.lists.deleteOne({ _id: list });
    if (result.deletedCount === 0) {
      return { error: `Failed to delete list with ID '${list}'.` };
    }
    return {};
  }

  /**
   * markItemCompleted (list: List, item: Item, completed: Boolean)
   *
   * **requires** list exists AND item is in list.items
   *
   * **effects**
   * The completion status of the item in the list is updated to the provided value.
   */
  async markItemCompleted(
    { list, item, completed }: { list: List; item: Item; completed: boolean },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Requires: item is in list.items
    const itemIndex = existingList.items.findIndex((i: ListItem) => i.id === item);
    if (itemIndex === -1) {
      return { error: `Item with ID '${item}' not found in list '${list}'.` };
    }

    // Effects: Update the completion status of the specific item
    await this.lists.updateOne(
      { _id: list, "items.id": item },
      { $set: { "items.$.completed": completed } }, // Use positional operator to update the matched item
    );

    return {};
  }

  /**
   * clearCompletedItems (list: List)
   *
   * **requires** list exists
   *
   * **effects**
   * All items in the list where itemCompleted is true are removed from the list's items set.
   */
  async clearCompletedItems(
    { list }: { list: List },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Effects: Filter out completed items based on the ListItem structure
    const updatedItems = existingList.items.filter((item) => !item.completed);

    await this.lists.updateOne(
      { _id: list },
      { $set: { items: updatedItems } }, // Replace the items array with the filtered one
    );

    return {};
  }

  /**
   * updateListSettings (list: List, autoClearCompleted: Boolean?, recurrenceType: RecurrenceType?)
   *
   * **requires**
   * list exists
   * if recurrenceType is provided and is not none, list must have both startTime and endTime
   *
   * **effects**
   * If autoClearCompleted is provided, the list's autoClearCompleted flag is updated.
   * If recurrenceType is provided, the list's recurrenceType is updated.
   */
  /**
   * updateList (list: List, newName?: string, newStartTime?: Time, newEndTime?: Time, newAutoClearCompleted?: boolean, newRecurrenceType?: RecurrenceType)
   *
   * **requires** `list` exists. If `newName` is provided, it must be unique for the owner. If time constraints are provided, they must be valid.
   *
   * **effects**
   * Updates the specified list with the provided values. Returns the updated list ID or an error if validation fails.
   */
  async updateList(
    { list, newName, newStartTime, newEndTime, newAutoClearCompleted, newRecurrenceType }: {
      list: List;
      newName?: string;
      newStartTime?: Date;
      newEndTime?: Date;
      newAutoClearCompleted?: boolean;
      newRecurrenceType?: RecurrenceType;
    },
  ): Promise<{ list: List } | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    const update: Partial<ListDocument> = {};

    // Update name if provided
    if (newName !== undefined && newName !== existingList.name) {
      const duplicate = await this.lists.findOne({
        owner: existingList.owner,
        name: newName,
        _id: { $ne: list },
      });
      if (duplicate) {
        return { error: `List with name '${newName}' already exists for this owner.` };
      }
      update.name = newName;
    }

    // Update times if provided
    let startTime = newStartTime !== undefined ? newStartTime : existingList.startTime;
    let endTime = newEndTime !== undefined ? newEndTime : existingList.endTime;

    // Convert to Date objects if they are strings (from MongoDB)
    startTime = startTime instanceof Date ? startTime : new Date(startTime);
    endTime = endTime instanceof Date ? endTime : new Date(endTime);

    if (newStartTime !== undefined) {
      update.startTime = newStartTime;
    }
    if (newEndTime !== undefined) {
      update.endTime = newEndTime;
    }

    // Validate time constraints
    if (startTime.getTime() > endTime.getTime()) {
      return { error: "Start time must be before or equal to end time." };
    }

    // Check if any existing items would fall outside the new time range
    // Only check if time boundaries are being updated (not default dates)
    const hasNonDefaultDates =
      startTime.getTime() !== TodoListConcept.MIN_DATE.getTime() ||
      endTime.getTime() !== TodoListConcept.MAX_DATE.getTime();

    if (hasNonDefaultDates && (newStartTime !== undefined || newEndTime !== undefined)) {
      const outOfRangeItems = existingList.items.filter(item => {
        if (!item.dueDate) return false; // Items without due dates are always valid

        const dueDate = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate);
        return dueDate < startTime || dueDate > endTime;
      });

      if (outOfRangeItems.length > 0) {
        const itemText = outOfRangeItems.length === 1 ? "item" : "items";
        return {
          error: `Cannot update list times: ${outOfRangeItems.length} ${itemText} would fall outside the new time range. Please remove or adjust these items first.`
        };
      }
    }

    // Update autoClearCompleted if provided
    if (newAutoClearCompleted !== undefined) {
      update.autoClearCompleted = newAutoClearCompleted;
    }

    // Update recurrenceType if provided
    if (newRecurrenceType !== undefined) {
      const hasDefaultDates = this.hasDefaultDates({
        ...existingList,
        startTime,
        endTime,
      });
      if (newRecurrenceType !== "none" && hasDefaultDates) {
        return {
          error:
            "For recurring lists, both start time and end time must be set if recurrenceType is not 'none'.",
        };
      }
      update.recurrenceType = newRecurrenceType;
    }

    // Only perform update if there are changes to apply
    if (Object.keys(update).length > 0) {
      await this.lists.updateOne(
        { _id: list },
        { $set: update },
      );
    }

    return { list };
  }

  async updateListSettings(
    { list, autoClearCompleted, recurrenceType }: {
      list: List;
      autoClearCompleted?: boolean;
      recurrenceType?: RecurrenceType;
    },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    const update: Partial<ListDocument> = {};

    // Update autoClearCompleted if provided
    if (typeof autoClearCompleted === "boolean") {
      update.autoClearCompleted = autoClearCompleted;
    }

    // Update recurrenceType if provided
    if (recurrenceType !== undefined) {
      // Requires: if recurrenceType is provided and is not none, list must have explicit (non-default) dates
      if (recurrenceType !== "none" && this.hasDefaultDates(existingList)) {
        return {
          error:
            "For recurring lists, both start time and end time must be set if recurrenceType is not 'none'.",
        };
      }
      update.recurrenceType = recurrenceType;
    }

    // Only perform update if there are changes to apply
    if (Object.keys(update).length > 0) {
      await this.lists.updateOne(
        { _id: list },
        { $set: update },
      );
    }

    return {};
  }

  // --- System Actions ---

  /**
   * autoClearIfNeeded (list: List)
   * This action is triggered autonomously by the system.
   *
   * **requires**
   * list exists
   * list.autoClearCompleted is true
   * current time is after list.endTime
   *
   * **effects**
   * Removes all items in the list where itemCompleted is true.
   */
  async autoClearIfNeeded(
    { list }: { list: List },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Requires: list.autoClearCompleted is true AND current time is after list.endTime
    // endTime is always set (defaults to MAX_DATE if not explicitly provided)
    if (
      !existingList.autoClearCompleted ||
      new Date() <= existingList.endTime
    ) {
      // Precondition not met, the action does not fire.
      // For system actions, this typically means returning an empty success
      // as it's not an error but rather a non-firing condition.
      return {};
    }

    // Effects: Removes all items where itemCompleted is true
    const updatedItems = existingList.items.filter((item) => !item.completed);
    await this.lists.updateOne(
      { _id: list },
      { $set: { items: updatedItems } },
    );

    return {};
  }

  /**
   * recreateRecurringList (list: List)
   * This action is triggered autonomously by the system.
   *
   * **requires**
   * list exists
   * list.recurrenceType is not none
   * current time is after list.endTime
   *
   * **effects**
   * A new list is created with the same name, owner, autoClearCompleted, and recurrenceType settings.
   * The new list's time range is calculated based on the recurrenceType:
   * - daily: new startTime is list.endTime + 1 day, new endTime is list.endTime + 1 day
   * - weekly: new startTime is list.endTime + 1 week, new endTime is list.endTime + 1 week
   * - monthly: new startTime is list.endTime + 1 month, new endTime is list.endTime + 1 month
   * All uncompleted items from the old list are carried over to the new list,
   * with their due dates adjusted relative to the new list's start time.
   * The original list remains unchanged (archived).
   */
  async recreateRecurringList(
    { list }: { list: List },
  ): Promise<Empty | { error: string }> {
    const existingList = await this.lists.findOne({ _id: list });
    if (!existingList) {
      return { error: `List with ID '${list}' not found.` };
    }

    // Requires: list.recurrenceType is not none AND current time is after list.endTime
    // (also implicitly requires endTime to be set)
    if (
      existingList.recurrenceType === "none" ||
      !existingList.endTime ||
      new Date() <= existingList.endTime
    ) {
      // Precondition not met, action does not fire.
      return {};
    }

    // Calculate the duration of the original list
    const duration = existingList.endTime.getTime() - existingList.startTime!.getTime();

    let newStartTime: Time | undefined;
    let newEndTime: Time | undefined;

    // Calculate new time range based on recurrenceType
    // The new list maintains the same duration as the original
    // The new list starts one period after the OLD list's start time (to maintain continuity)
    switch (existingList.recurrenceType) {
      case "daily":
        newStartTime = addDays(existingList.startTime, 1);
        newEndTime = new Date(newStartTime.getTime() + duration);
        break;
      case "weekly":
        newStartTime = addWeeks(existingList.startTime, 1);
        newEndTime = new Date(newStartTime.getTime() + duration);
        break;
      case "monthly":
        newStartTime = addMonths(existingList.startTime, 1);
        newEndTime = new Date(newStartTime.getTime() + duration);
        break;
      default:
        // Should not happen if recurrenceType is correctly validated upon creation/update
        return { error: `Unknown recurrence type: ${existingList.recurrenceType}` };
    }

    // Effects: Carry over uncompleted items and adjust their due dates
    const uncompletedItems = existingList.items.filter((item) =>
      !item.completed
    );

    const carriedOverItems: ListItem[] = uncompletedItems.map((item) => {
      let adjustedDueDate = item.dueDate;
      // If both old and new lists have start times, and the item had a due date, adjust it
      if (existingList.startTime && newStartTime && item.dueDate) {
        // Calculate the time shift (in milliseconds) from the old list's start to the new list's start
        const timeShift = newStartTime.getTime() - existingList.startTime.getTime();
        // Convert item.dueDate to Date object if it's a string (from MongoDB)
        const itemDueDateObj = item.dueDate instanceof Date ? item.dueDate : new Date(item.dueDate);
        adjustedDueDate = new Date(itemDueDateObj.getTime() + timeShift);
      }
      return {
        id: item.id,
        completed: false, // Items are uncompleted in the new list
        dueDate: adjustedDueDate,
      };
    });

    // Effects: Create and insert the new recurring list
    const newList: ListDocument = {
      _id: freshID() as List,
      name: existingList.name,
      owner: existingList.owner,
      items: carriedOverItems,
      startTime: newStartTime,
      endTime: newEndTime,
      autoClearCompleted: existingList.autoClearCompleted,
      recurrenceType: existingList.recurrenceType,
    };

    await this.lists.insertOne(newList);

    // The original list remains unchanged (archived implicitly by not being modified)
    return {};
  }

  // --- Queries ---

  /**
   * getListsForUser (user: User): (lists: set of List)
   *
   * **requires** user is valid (assumed by user: User type)
   *
   * **effects**
   * Returns the set of all lists owned by the specified user.
   * Before returning, automatically processes expired recurring lists and auto-clear settings.
   */
  async getListsForUser(
    { user }: { user: User },
  ): Promise<{ lists: ListDocument[] }> {
    // First, process any expired recurring lists (recreate them for the next period)
    await this.processRecurringLists({ user });

    // Finds all lists where the owner matches the provided user ID
    const userLists = await this.lists.find({ owner: user }).toArray();
    return { lists: userLists }; // Returns an array of ListDocument objects
  }

  /**
   * getListByName (user: User, name: String): (list: List)
   *
   * **requires** user is valid, name is non-empty
   *
   * **effects**
   * Returns the list with the specified name owned by the user, or error if not found.
   */
  async getListByName(
    { user, name }: { user: User; name: string },
  ): Promise<{ list: ListDocument } | { error: string }> {
    // Requires: name is non-empty
    if (!name || name.trim() === "") {
      return { error: "List name cannot be empty." };
    }

    // Finds a single list by owner and name
    const list = await this.lists.findOne({ owner: user, name });
    if (!list) {
      return { error: `List with name '${name}' for user '${user}' not found.` };
    }
    return { list: list }; // Returns the found ListDocument
  }

  /**
   * getActiveListsForUser (user: User): (lists: set of List)
   *
   * **requires** user is valid
   *
   * **effects**
   * Returns the set of all lists owned by the user where current time is between startTime and endTime (inclusive).
   * Lists created without explicit time ranges use MIN_DATE/MAX_DATE and are always active.
   * Before returning, automatically processes expired recurring lists and auto-clear settings.
   */
  async getActiveListsForUser(
    { user }: { user: User },
  ): Promise<{ lists: ListDocument[] }> {
    const currentTime = new Date();

    // First, process any expired recurring lists (recreate them for the next period)
    await this.processRecurringLists({ user });

    // Finds lists for the user that are currently active
    // Active means current time is within startTime and endTime range
    // Lists without explicit time ranges have MIN_DATE/MAX_DATE, so they're always active
    const activeLists = await this.lists.find({
      owner: user,
      startTime: { $lte: currentTime },
      endTime: { $gte: currentTime },
    }).toArray();

    return { lists: activeLists }; // Returns an array of active ListDocument objects
  }

  /**
   * processRecurringLists (user: User)
   * Helper method to automatically recreate expired recurring lists.
   *
   * **requires** user is valid
   *
   * **effects**
   * Finds all recurring lists owned by the user that have expired (current time > endTime)
   * and recreates them for the next time period if they haven't already been recreated.
   * Also auto-clears completed items if enabled.
   */
  async processRecurringLists(
    { user }: { user: User },
  ): Promise<Empty> {
    const currentTime = new Date();

    // Find all expired recurring lists for this user
    const expiredRecurringLists = await this.lists.find({
      owner: user,
      recurrenceType: { $ne: "none" },
      endTime: { $lt: currentTime },
    }).toArray();

    // Process each expired recurring list
    for (const list of expiredRecurringLists) {
      // Check if a successor list has already been created
      // A successor would have the same name and owner, with a startTime right after this list's endTime
      const duration = list.endTime.getTime() - list.startTime.getTime();

      // Calculate when the next list should start (immediately after this one ends)
      let nextStartTime: Time;
      switch (list.recurrenceType) {
        case "daily":
          nextStartTime = addDays(list.startTime, 1);
          break;
        case "weekly":
          nextStartTime = addWeeks(list.startTime, 1);
          break;
        case "monthly":
          nextStartTime = addMonths(list.startTime, 1);
          break;
        default:
          continue; // Skip unknown recurrence types
      }

      // Check if a list with this name and the expected next start time already exists
      const successorExists = await this.lists.findOne({
        owner: user,
        name: list.name,
        startTime: nextStartTime,
      });

      if (successorExists) {
        // Already recreated, skip
        continue;
      }

      // Auto-clear completed items if enabled
      if (list.autoClearCompleted) {
        await this.autoClearIfNeeded({ list: list._id });
      }

      // Recreate the list for the next period
      await this.recreateRecurringList({ list: list._id });
    }

    return {};
  }
}