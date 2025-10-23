---
timestamp: 'Thu Oct 23 2025 17:26:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_172622.a21d09d4.md]]'
content_id: 563499c944222d4a04325e068cac09997078087f739e3c017dd832045d40f6cb
---

# file: src/concepts/TodoListConcept.test.ts

```typescript
import { assertEquals, assertNotEquals, assertExists, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import TodoListConcept from "./TodoListConcept.ts";

Deno.test("TodoListConcept Integration Tests", async (test) => {
  const [db, client] = await testDb();
  const todoListConcept = new TodoListConcept(db);

  // Define test users and items
  const userA: ID = "user:Alice" as ID;
  const userB: ID = "user:Bob" as ID;
  const item1: ID = "item:Task1" as ID;
  const item2: ID = "item:Task2" as ID;
  const item3: ID = "item:Task3" as ID;
  const item4: ID = "item:Task4" as ID;

  Deno.test("0. Purpose: Enable users to organize items into named, time-scoped collections with automatic lifecycle management", () => {
    console.log(
      "\n--- Testing TodoListConcept Purpose ---",
    );
    // The purpose is primarily descriptive and evaluated by the success of the actions and principle.
    // This test block mainly serves as a header for the subsequent detailed tests.
    console.log("Purpose is verified through detailed action and principle tests.");
  });

  await test.step(
    "1. createList: Successfully creates a new list with various settings",
    async () => {
      console.log("\n--- Testing createList ---");

      // Test Case 1.1: Basic list creation
      console.log("1.1 Creating a basic list 'My Daily Tasks' for User A.");
      const listAResult = await todoListConcept.createList({
        owner: userA,
        name: "My Daily Tasks",
        autoClearCompleted: true,
        recurrenceType: "daily",
      });
      assertExists((listAResult as { list: ID }).list, "Should return a list ID");
      const listAId = (listAResult as { list: ID }).list;
      console.log(`  Created List A (ID: ${listAId})`);

      const retrievedListA = await todoListConcept.getListByName({
        user: userA,
        name: "My Daily Tasks",
      });
      assertExists(
        (retrievedListA as { list: any }).list,
        "List A should be retrievable by name",
      );
      assertEquals(
        (retrievedListA as { list: any }).list._id,
        listAId,
        "Retrieved list ID should match",
      );
      assertEquals(
        (retrievedListA as { list: any }).list.name,
        "My Daily Tasks",
        "Retrieved list name should match",
      );
      assertEquals(
        (retrievedListA as { list: any }).list.owner,
        userA,
        "Retrieved list owner should match",
      );
      assertEquals(
        (retrievedListA as { list: any }).list.recurrenceType,
        "daily",
        "Retrieved list recurrenceType should match",
      );
      console.log("  Successfully verified List A creation.");

      // Test Case 1.2: List creation with time range
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
      console.log(
        "1.2 Creating a time-scoped list 'Weekly Goals' for User A.",
      );
      const listBResult = await todoListConcept.createList({
        owner: userA,
        name: "Weekly Goals",
        startTime,
        endTime,
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      assertExists((listBResult as { list: ID }).list, "Should return a list ID");
      const listBId = (listBResult as { list: ID }).list;
      console.log(`  Created List B (ID: ${listBId})`);

      const retrievedListB = await todoListConcept.getListByName({
        user: userA,
        name: "Weekly Goals",
      });
      assertExists(
        (retrievedListB as { list: any }).list,
        "List B should be retrievable by name",
      );
      assertEquals(
        (retrievedListB as { list: any }).list.startTime.getTime(),
        startTime.getTime(),
        "Retrieved list start time should match",
      );
      assertEquals(
        (retrievedListB as { list: any }).list.endTime.getTime(),
        endTime.getTime(),
        "Retrieved list end time should match",
      );
      console.log("  Successfully verified List B creation with time scope.");

      // Test Case 1.3: Failure - Duplicate list name for same user
      console.log("1.3 Attempting to create a duplicate list name for User A.");
      const duplicateResult = await todoListConcept.createList({
        owner: userA,
        name: "My Daily Tasks",
        autoClearCompleted: true,
        recurrenceType: "daily",
      });
      assertExists(
        (duplicateResult as { error: string }).error,
        "Should return an error for duplicate name",
      );
      assertEquals(
        (duplicateResult as { error: string }).error,
        "A list with this name already exists for this user.",
        "Error message should indicate duplicate name",
      );
      console.log("  Successfully prevented duplicate list name for same user.");

      // Test Case 1.4: Failure - Empty list name
      console.log("1.4 Attempting to create a list with an empty name.");
      const emptyNameResult = await todoListConcept.createList({
        owner: userA,
        name: "",
        autoClearCompleted: true,
        recurrenceType: "none",
      });
      assertExists(
        (emptyNameResult as { error: string }).error,
        "Should return an error for empty name",
      );
      assertEquals(
        (emptyNameResult as { error: string }).error,
        "List name cannot be empty.",
        "Error message should indicate empty name",
      );
      console.log("  Successfully prevented list creation with empty name.");

      // Test Case 1.5: Failure - Start time after end time
      console.log("1.5 Attempting to create a list with startTime > endTime.");
      const invalidTimeResult = await todoListConcept.createList({
        owner: userA,
        name: "Invalid Time List",
        startTime: new Date(),
        endTime: new Date(Date.now() - 1000), // End time before start time
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      assertExists(
        (invalidTimeResult as { error: string }).error,
        "Should return an error for invalid time range",
      );
      assertEquals(
        (invalidTimeResult as { error: string }).error,
        "Start time cannot be after end time.",
        "Error message should indicate invalid time range",
      );
      console.log("  Successfully prevented list creation with invalid time range.");

      // Test Case 1.6: Failure - Recurring list without time range
      console.log("1.6 Attempting to create a recurring list without time bounds.");
      const recurringNoTimeResult = await todoListConcept.createList({
        owner: userA,
        name: "Recurring No Time",
        autoClearCompleted: true,
        recurrenceType: "weekly",
      });
      assertExists(
        (recurringNoTimeResult as { error: string }).error,
        "Should return an error for recurring list without time bounds",
      );
      assertEquals(
        (recurringNoTimeResult as { error: string }).error,
        "For recurring lists, both start time and end time must be provided.",
        "Error message should indicate missing time for recurring list",
      );
      console.log(
        "  Successfully prevented recurring list creation without time bounds.",
      );
    },
  );

  await test.step(
    "2. addListItem: Adds items, respecting time scope, and handles errors",
    async () => {
      console.log("\n--- Testing addListItem ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Items Test List",
        startTime: new Date(Date.now() - 3600 * 1000), // 1 hour ago
        endTime: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      console.log(`  Created list '${listId}' for item addition tests.`);

      // Test Case 2.1: Successfully add an item
      console.log(`2.1 Adding item '${item1}' to list '${listId}'.`);
      const addResult1 = await todoListConcept.addListItem({
        list: listId,
        item: item1,
        itemDueDate: new Date(),
      });
      assertEquals(addResult1, {}, "Should successfully add item1");
      console.log(`  Item '${item1}' added.`);

      const listAfterAdd1 = (await todoListConcept.getListByName({
        user: userA,
        name: "Items Test List",
      }) as { list: any }).list;
      assertEquals(listAfterAdd1.items.length, 1, "List should have 1 item");
      assertEquals(listAfterAdd1.items[0].id, item1, "Item1 should be in the list");
      assertEquals(
        listAfterAdd1.items[0].completed,
        false,
        "Item1 should initially be uncompleted",
      );
      console.log("  Verified item1 is in the list and uncompleted.");

      // Test Case 2.2: Add another item without due date (within implicit list scope)
      console.log(`2.2 Adding item '${item2}' to list '${listId}' without due date.`);
      const addResult2 = await todoListConcept.addListItem({
        list: listId,
        item: item2,
      });
      assertEquals(addResult2, {}, "Should successfully add item2");
      console.log(`  Item '${item2}' added.`);

      const listAfterAdd2 = (await todoListConcept.getListByName({
        user: userA,
        name: "Items Test List",
      }) as { list: any }).list;
      assertEquals(listAfterAdd2.items.length, 2, "List should have 2 items");
      assert(
        listAfterAdd2.items.some((i: any) => i.id === item2),
        "Item2 should be in the list",
      );
      console.log("  Verified item2 is in the list.");

      // Test Case 2.3: Failure - List not found
      console.log("2.3 Attempting to add an item to a non-existent list.");
      const notFoundResult = await todoListConcept.addListItem({
        list: "nonExistentList" as ID,
        item: item3,
      });
      assertExists(
        (notFoundResult as { error: string }).error,
        "Should return an error for non-existent list",
      );
      assertEquals(
        (notFoundResult as { error: string }).error,
        "List with ID 'nonExistentList' not found.",
        "Error message should indicate list not found",
      );
      console.log("  Successfully prevented item addition to non-existent list.");

      // Test Case 2.4: Failure - Duplicate item in list
      console.log(`2.4 Attempting to add duplicate item '${item1}' to list '${listId}'.`);
      const duplicateItemResult = await todoListConcept.addListItem({
        list: listId,
        item: item1,
      });
      assertExists(
        (duplicateItemResult as { error: string }).error,
        "Should return an error for duplicate item",
      );
      assertEquals(
        (duplicateItemResult as { error: string }).error,
        `Item with ID '${item1}' already exists in list '${listId}'.`,
        "Error message should indicate duplicate item",
      );
      console.log("  Successfully prevented duplicate item addition.");

      // Test Case 2.5: Failure - Item due date before list start time
      console.log(
        "2.5 Attempting to add an item with due date before list start time.",
      );
      const dueDateBeforeStart = new Date(Date.now() - 2 * 3600 * 1000); // 2 hours ago
      const beforeStartResult = await todoListConcept.addListItem({
        list: listId,
        item: item3,
        itemDueDate: dueDateBeforeStart,
      });
      assertExists(
        (beforeStartResult as { error: string }).error,
        "Should return an error for due date before start time",
      );
      assert(
        (beforeStartResult as { error: string }).error.includes(
          "is before the list's start time",
        ),
        "Error message should indicate due date before start time",
      );
      console.log("  Successfully prevented item addition with due date before list start.");

      // Test Case 2.6: Failure - Item due date after list end time
      console.log(
        "2.6 Attempting to add an item with due date after list end time.",
      );
      const dueDateAfterEnd = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours from now
      const afterEndResult = await todoListConcept.addListItem({
        list: listId,
        item: item4,
        itemDueDate: dueDateAfterEnd,
      });
      assertExists(
        (afterEndResult as { error: string }).error,
        "Should return an error for due date after end time",
      );
      assert(
        (afterEndResult as { error: string }).error.includes(
          "is after the list's end time",
        ),
        "Error message should indicate due date after end time",
      );
      console.log("  Successfully prevented item addition with due date after list end.");
    },
  );

  await test.step(
    "3. removeListItem: Removes items and handles errors",
    async () => {
      console.log("\n--- Testing removeListItem ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Remove Test List",
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listId, item: item1 });
      await todoListConcept.addListItem({ list: listId, item: item2 });
      console.log(
        `  Created list '${listId}' with items '${item1}' and '${item2}'.`,
      );

      // Test Case 3.1: Successfully remove an item
      console.log(`3.1 Removing item '${item1}' from list '${listId}'.`);
      const removeResult = await todoListConcept.removeListItem({
        list: listId,
        item: item1,
      });
      assertEquals(removeResult, {}, "Should successfully remove item1");
      console.log(`  Item '${item1}' removed.`);

      const listAfterRemove = (await todoListConcept.getListByName({
        user: userA,
        name: "Remove Test List",
      }) as { list: any }).list;
      assertEquals(listAfterRemove.items.length, 1, "List should have 1 item");
      assertEquals(
        listAfterRemove.items[0].id,
        item2,
        "Only item2 should remain in the list",
      );
      console.log("  Verified item1 is no longer in the list.");

      // Test Case 3.2: Failure - List not found
      console.log("3.2 Attempting to remove item from a non-existent list.");
      const notFoundResult = await todoListConcept.removeListItem({
        list: "nonExistentList" as ID,
        item: item1,
      });
      assertExists(
        (notFoundResult as { error: string }).error,
        "Should return an error for non-existent list",
      );
      console.log("  Successfully prevented item removal from non-existent list.");

      // Test Case 3.3: Failure - Item not in list
      console.log(`3.3 Attempting to remove non-existent item '${item3}' from list '${listId}'.`);
      const itemNotInListResult = await todoListConcept.removeListItem({
        list: listId,
        item: item3,
      });
      assertExists(
        (itemNotInListResult as { error: string }).error,
        "Should return an error for item not in list",
      );
      assertEquals(
        (itemNotInListResult as { error: string }).error,
        `Item with ID '${item3}' not found in list '${listId}'.`,
        "Error message should indicate item not found",
      );
      console.log("  Successfully prevented removal of an item not in the list.");
    },
  );

  await test.step(
    "4. markItemCompleted: Updates item completion status",
    async () => {
      console.log("\n--- Testing markItemCompleted ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Completion Test List",
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listId, item: item1 });
      console.log(`  Created list '${listId}' with item '${item1}'.`);

      // Test Case 4.1: Mark item as completed
      console.log(`4.1 Marking item '${item1}' as completed in list '${listId}'.`);
      const markCompletedResult = await todoListConcept.markItemCompleted({
        list: listId,
        item: item1,
        completed: true,
      });
      assertEquals(markCompletedResult, {}, "Should successfully mark item completed");
      console.log(`  Item '${item1}' marked completed.`);

      const listAfterMark = (await todoListConcept.getListByName({
        user: userA,
        name: "Completion Test List",
      }) as { list: any }).list;
      assertEquals(
        listAfterMark.items[0].completed,
        true,
        "Item1 should be completed",
      );
      console.log("  Verified item1 is completed.");

      // Test Case 4.2: Mark item as uncompleted
      console.log(`4.2 Marking item '${item1}' as uncompleted in list '${listId}'.`);
      const markUncompletedResult = await todoListConcept.markItemCompleted({
        list: listId,
        item: item1,
        completed: false,
      });
      assertEquals(
        markUncompletedResult,
        {},
        "Should successfully mark item uncompleted",
      );
      console.log(`  Item '${item1}' marked uncompleted.`);

      const listAfterUnmark = (await todoListConcept.getListByName({
        user: userA,
        name: "Completion Test List",
      }) as { list: any }).list;
      assertEquals(
        listAfterUnmark.items[0].completed,
        false,
        "Item1 should be uncompleted",
      );
      console.log("  Verified item1 is uncompleted.");

      // Test Case 4.3: Failure - List not found
      console.log("4.3 Attempting to mark item in a non-existent list.");
      const notFoundResult = await todoListConcept.markItemCompleted({
        list: "nonExistentList" as ID,
        item: item1,
        completed: true,
      });
      assertExists(
        (notFoundResult as { error: string }).error,
        "Should return an error for non-existent list",
      );
      console.log("  Successfully prevented marking item in non-existent list.");

      // Test Case 4.4: Failure - Item not in list
      console.log(`4.4 Attempting to mark non-existent item '${item2}' in list '${listId}'.`);
      const itemNotInListResult = await todoListConcept.markItemCompleted({
        list: listId,
        item: item2,
        completed: true,
      });
      assertExists(
        (itemNotInListResult as { error: string }).error,
        "Should return an error for item not in list",
      );
      assertEquals(
        (itemNotInListResult as { error: string }).error,
        `Item with ID '${item2}' not found in list '${listId}'.`,
        "Error message should indicate item not found",
      );
      console.log("  Successfully prevented marking non-existent item.");
    },
  );

  await test.step(
    "5. deleteList: Removes a list and handles errors",
    async () => {
      console.log("\n--- Testing deleteList ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Delete Test List",
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      console.log(`  Created list '${listId}' for deletion tests.`);

      // Test Case 5.1: Successfully delete a list
      console.log(`5.1 Deleting list '${listId}'.`);
      const deleteResult = await todoListConcept.deleteList({ list: listId });
      assertEquals(deleteResult, {}, "Should successfully delete list");
      console.log(`  List '${listId}' deleted.`);

      const retrieveDeleted = await todoListConcept.getListByName({
        user: userA,
        name: "Delete Test List",
      });
      assertExists(
        (retrieveDeleted as { error: string }).error,
        "Retrieving deleted list should return an error",
      );
      assertEquals(
        (retrieveDeleted as { error: string }).error,
        `List with name 'Delete Test List' for user 'user:Alice' not found.`,
        "Error message should indicate list not found",
      );
      console.log("  Verified list is no longer retrievable.");

      // Test Case 5.2: Failure - Delete non-existent list
      console.log("5.2 Attempting to delete a non-existent list.");
      const nonExistentResult = await todoListConcept.deleteList({
        list: "nonExistentList" as ID,
      });
      assertExists(
        (nonExistentResult as { error: string }).error,
        "Should return an error for non-existent list",
      );
      assertEquals(
        (nonExistentResult as { error: string }).error,
        "List with ID 'nonExistentList' not found.",
        "Error message should indicate list not found",
      );
      console.log("  Successfully prevented deletion of a non-existent list.");
    },
  );

  await test.step(
    "6. clearCompletedItems: Clears only completed items",
    async () => {
      console.log("\n--- Testing clearCompletedItems ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Clear Test List",
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listId, item: item1 }); // Uncompleted
      await todoListConcept.addListItem({ list: listId, item: item2 }); // Uncompleted
      await todoListConcept.addListItem({ list: listId, item: item3 }); // Uncompleted
      await todoListConcept.markItemCompleted({
        list: listId,
        item: item1,
        completed: true,
      });
      await todoListConcept.markItemCompleted({
        list: listId,
        item: item3,
        completed: true,
      });
      console.log(
        `  Created list '${listId}' with items '${item1}' (completed), '${item2}' (uncompleted), '${item3}' (completed).`,
      );

      // Test Case 6.1: Successfully clear completed items
      console.log(`6.1 Clearing completed items from list '${listId}'.`);
      const clearResult = await todoListConcept.clearCompletedItems({
        list: listId,
      });
      assertEquals(clearResult, {}, "Should successfully clear completed items");
      console.log("  Completed items cleared.");

      const listAfterClear = (await todoListConcept.getListByName({
        user: userA,
        name: "Clear Test List",
      }) as { list: any }).list;
      assertEquals(
        listAfterClear.items.length,
        1,
        "List should have only 1 item remaining",
      );
      assertEquals(
        listAfterClear.items[0].id,
        item2,
        "Only uncompleted item2 should remain",
      );
      console.log("  Verified only uncompleted item remained.");

      // Test Case 6.2: Failure - List not found
      console.log("6.2 Attempting to clear items from a non-existent list.");
      const notFoundResult = await todoListConcept.clearCompletedItems({
        list: "nonExistentList" as ID,
      });
      assertExists(
        (notFoundResult as { error: string }).error,
        "Should return an error for non-existent list",
      );
      console.log("  Successfully prevented clearing items from non-existent list.");
    },
  );

  await test.step(
    "7. updateListSettings: Updates list configurations",
    async () => {
      console.log("\n--- Testing updateListSettings ---");
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Settings Test List",
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      console.log(`  Created list '${listId}' for settings updates.`);

      // Test Case 7.1: Update autoClearCompleted
      console.log("7.1 Updating autoClearCompleted to true.");
      const updateAutoClearResult = await todoListConcept.updateListSettings({
        list: listId,
        autoClearCompleted: true,
      });
      assertEquals(
        updateAutoClearResult,
        {},
        "Should successfully update autoClearCompleted",
      );
      console.log("  autoClearCompleted updated.");

      let updatedList = (await todoListConcept.getListByName({
        user: userA,
        name: "Settings Test List",
      }) as { list: any }).list;
      assertEquals(
        updatedList.autoClearCompleted,
        true,
        "autoClearCompleted should be true",
      );
      console.log("  Verified autoClearCompleted change.");

      // Test Case 7.2: Update recurrenceType
      console.log("7.2 Updating recurrenceType to weekly.");
      const updateRecurrenceResult = await todoListConcept.updateListSettings({
        list: listId,
        recurrenceType: "weekly",
      });
      assertEquals(
        updateRecurrenceResult,
        {},
        "Should successfully update recurrenceType",
      );
      console.log("  recurrenceType updated.");

      updatedList = (await todoListConcept.getListByName({
        user: userA,
        name: "Settings Test List",
      }) as { list: any }).list;
      assertEquals(
        updatedList.recurrenceType,
        "weekly",
        "recurrenceType should be weekly",
      );
      console.log("  Verified recurrenceType change.");

      // Test Case 7.3: Failure - Recurring without time bounds
      console.log(
        "7.3 Attempting to update recurrenceType to daily for a list without time bounds (expect error for this scenario, though initial list has bounds)",
      );
      const listNoTimeId = (await todoListConcept.createList({
        owner: userA,
        name: "No Time For Recurring",
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      const recurringNoTimeResult = await todoListConcept.updateListSettings({
        list: listNoTimeId,
        recurrenceType: "daily",
      });
      assertExists(
        (recurringNoTimeResult as { error: string }).error,
        "Should return an error for setting recurrence without time bounds",
      );
      assertEquals(
        (recurringNoTimeResult as { error: string }).error,
        "For recurring lists, both start time and end time must be set if recurrenceType is not 'none'.",
        "Error message should indicate missing time for recurring list",
      );
      console.log(
        "  Successfully prevented setting recurrenceType without time bounds.",
      );
    },
  );

  await test.step(
    "8. System Action: autoClearIfNeeded",
    async () => {
      console.log("\n--- Testing system action autoClearIfNeeded ---");

      // Test Case 8.1: Precondition met - Should clear completed items
      const pastEndTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "AutoClear Test List",
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        endTime: pastEndTime,
        autoClearCompleted: true,
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listId, item: item1 });
      await todoListConcept.addListItem({ list: listId, item: item2 });
      await todoListConcept.markItemCompleted({
        list: listId,
        item: item1,
        completed: true,
      });
      console.log(
        `  Created auto-clear list '${listId}' with '${item1}' (completed) and '${item2}' (uncompleted). End time is in the past.`,
      );

      console.log("8.1 Triggering autoClearIfNeeded (precondition met).");
      const autoClearResult = await todoListConcept.autoClearIfNeeded({
        list: listId,
      });
      assertEquals(autoClearResult, {}, "Should successfully run autoClearIfNeeded");
      console.log("  autoClearIfNeeded executed.");

      const listAfterAutoClear = (await todoListConcept.getListByName({
        user: userA,
        name: "AutoClear Test List",
      }) as { list: any }).list;
      assertEquals(
        listAfterAutoClear.items.length,
        1,
        "List should have 1 item after auto clear",
      );
      assertEquals(
        listAfterAutoClear.items[0].id,
        item2,
        "Only uncompleted item2 should remain after auto clear",
      );
      console.log("  Verified completed items were cleared by system action.");

      // Test Case 8.2: Precondition not met - autoClearCompleted is false
      const listNoAutoClearId = (await todoListConcept.createList({
        owner: userA,
        name: "NoAutoClear List",
        startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endTime: pastEndTime,
        autoClearCompleted: false, // Important for this test
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listNoAutoClearId, item: item1 });
      await todoListConcept.markItemCompleted({
        list: listNoAutoClearId,
        item: item1,
        completed: true,
      });
      console.log(
        `  Created list '${listNoAutoClearId}' with autoClearCompleted=false.`,
      );

      console.log("8.2 Triggering autoClearIfNeeded (autoClearCompleted is false).");
      const noAutoClearResult = await todoListConcept.autoClearIfNeeded({
        list: listNoAutoClearId,
      });
      assertEquals(noAutoClearResult, {}, "Should return empty success as precondition not met"); // No error, just doesn't fire
      console.log("  autoClearIfNeeded did not fire due to autoClearCompleted=false.");

      const listNoAutoClearAfter = (await todoListConcept.getListByName({
        user: userA,
        name: "NoAutoClear List",
      }) as { list: any }).list;
      assertEquals(
        listNoAutoClearAfter.items.length,
        1,
        "List should still have 1 item (item1 completed) as auto-clear did not happen",
      );
      assert(
        listNoAutoClearAfter.items[0].completed,
        "Item1 should still be completed",
      );
      console.log("  Verified no change when autoClearCompleted is false.");

      // Test Case 8.3: Precondition not met - End time is in the future
      const futureEndTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const listFutureTimeId = (await todoListConcept.createList({
        owner: userA,
        name: "FutureClear List",
        startTime: new Date(),
        endTime: futureEndTime,
        autoClearCompleted: true,
        recurrenceType: "none",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listFutureTimeId, item: item1 });
      await todoListConcept.markItemCompleted({
        list: listFutureTimeId,
        item: item1,
        completed: true,
      });
      console.log(
        `  Created list '${listFutureTimeId}' with endTime in the future.`,
      );

      console.log("8.3 Triggering autoClearIfNeeded (endTime is in the future).");
      const futureTimeResult = await todoListConcept.autoClearIfNeeded({
        list: listFutureTimeId,
      });
      assertEquals(futureTimeResult, {}, "Should return empty success as precondition not met");
      console.log("  autoClearIfNeeded did not fire due to end time in the future.");

      const listFutureTimeAfter = (await todoListConcept.getListByName({
        user: userA,
        name: "FutureClear List",
      }) as { list: any }).list;
      assertEquals(
        listFutureTimeAfter.items.length,
        1,
        "List should still have 1 item (item1 completed) as auto-clear did not happen",
      );
      assert(
        listFutureTimeAfter.items[0].completed,
        "Item1 should still be completed",
      );
      console.log("  Verified no change when end time is in the future.");
    },
  );

  await test.step(
    "9. System Action: recreateRecurringList",
    async () => {
      console.log("\n--- Testing system action recreateRecurringList ---");

      // Set up a list that is past its end time and recurring daily
      const originalStartTime = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      const originalEndTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const durationMs = originalEndTime.getTime() - originalStartTime.getTime();

      const listId = (await todoListConcept.createList({
        owner: userA,
        name: "Daily Recurring List",
        startTime: originalStartTime,
        endTime: originalEndTime,
        autoClearCompleted: true,
        recurrenceType: "daily",
      }) as { list: ID }).list;
      await todoListConcept.addListItem({ list: listId, item: item1 }); // Uncompleted
      await todoListConcept.addListItem({ list: listId, item: item2 }); // Completed (should not carry over)
      await todoListConcept.markItemCompleted({
        list: listId,
        item: item2,
        completed: true,
      });
      // Item 1 has no due date, so no adjustment will happen
      // Item 3 has a specific due date, which will be adjusted
      await todoListConcept.addListItem({
        list: listId,
        item: item3,
        itemDueDate: new Date(originalStartTime.getTime() + durationMs / 2),
      });

      console.log(
        `  Created daily recurring list '${listId}' (ended 2 days ago) with:`,
      );
      console.log(`    - Item '${item1}' (uncompleted, no due date)`);
      console.log(`    - Item '${item2}' (completed)`);
      console.log(
        `    - Item '${item3}' (uncompleted, due date adjusted relative to list start)`,
      );

      // Test Case 9.1: Precondition met - Daily recurrence
      console.log("9.1 Triggering recreateRecurringList for daily recurrence.");
      const recreateResult = await todoListConcept.recreateRecurringList({
        list: listId,
      });
      assertEquals(recreateResult, {}, "Should successfully recreate recurring list");
      console.log("  recreateRecurringList executed for daily list.");

      // Verify the new list exists
      const newLists = await todoListConcept.getListsForUser({ user: userA });
      const newDailyList = newLists.lists.find((l) =>
        l.name === "Daily Recurring List" && l._id !== listId
      );
      assertExists(newDailyList, "A new daily recurring list should have been created");
      console.log(`  New list created with ID: ${newDailyList!._id}`);

      // Verify new list properties
      const expectedNewStartTime = new Date(originalEndTime.getTime() + 24 * 60 * 60 * 1000);
      const expectedNewEndTime = new Date(expectedNewStartTime.getTime() + durationMs);

      assertEquals(
        newDailyList!.startTime!.getTime(),
        expectedNewStartTime.getTime(),
        "New list start time should be 1 day after old end time",
      );
      assertEquals(
        newDailyList!.endTime!.getTime(),
        expectedNewEndTime.getTime(),
        "New list end time should be 1 day after old end time + duration",
      );
      assertEquals(
        newDailyList!.recurrenceType,
        "daily",
        "New list should maintain daily recurrence type",
      );
      assertEquals(newDailyList!.owner, userA, "New list owner should be the same");
      assertEquals(newDailyList!.autoClearCompleted, true, "New list should maintain autoClearCompleted setting");

      // Verify items carried over
      assertEquals(newDailyList!.items.length, 2, "New list should have 2 uncompleted items carried over");
      assert(
        newDailyList!.items.some((i) => i.id === item1),
        "Item1 should be carried over",
      );
      assert(
        !newDailyList!.items.some((i) => i.id === item2),
        "Completed Item2 should NOT be carried over",
      );
      assert(
        newDailyList!.items.some((i) => i.id === item3),
        "Item3 should be carried over",
      );

      // Verify item3 due date adjustment
      const oldItem3DueDate = new Date(originalStartTime.getTime() + durationMs / 2);
      const expectedNewItem3DueDate = new Date(
        oldItem3DueDate.getTime() +
          (expectedNewStartTime.getTime() - originalStartTime.getTime()),
      );
      const newItem3 = newDailyList!.items.find((i) => i.id === item3);
      assertEquals(
        newItem3!.dueDate!.getTime(),
        expectedNewItem3DueDate.getTime(),
        "Item3 due date should be adjusted by time shift",
      );

      console.log("  Verified new daily recurring list creation and item carry-over/adjustment.");

      // Test Case 9.2: Precondition not met - recurrenceType is 'none'
      const listNoRecurrenceId = (await todoListConcept.createList({
        owner: userA,
        name: "Non-Recurring List",
        startTime: originalStartTime,
        endTime: originalEndTime,
        autoClearCompleted: false,
        recurrenceType: "none",
      }) as { list: ID }).list;
      console.log(
        `  Created non-recurring list '${listNoRecurrenceId}' (ended 2 days ago).`,
      );

      console.log(
        "9.2 Triggering recreateRecurringList (recurrenceType is 'none').",
      );
      const noRecurrenceResult = await todoListConcept.recreateRecurringList({
        list: listNoRecurrenceId,
      });
      assertEquals(noRecurrenceResult, {}, "Should return empty success as precondition not met");
      console.log("  recreateRecurringList did not fire for non-recurring list.");

      const listsAfterNoRecurrence = await todoListConcept.getListsForUser({
        user: userA,
      });
      assert(
        !listsAfterNoRecurrence.lists.some((l) =>
          l.name === "Non-Recurring List" && l._id !== listNoRecurrenceId
        ),
        "No new list should be created for non-recurring list",
      );
      console.log("  Verified no new list created when recurrenceType is 'none'.");

      // Test Case 9.3: Precondition not met - current time not past endTime
      const futureEndTimeListId = (await todoListConcept.createList({
        owner: userA,
        name: "Future Recurring List",
        startTime: new Date(),
        endTime: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now
        autoClearCompleted: true,
        recurrenceType: "daily",
      }) as { list: ID }).list;
      console.log(
        `  Created recurring list '${futureEndTimeListId}' with endTime in the future.`,
      );

      console.log(
        "9.3 Triggering recreateRecurringList (endTime is in the future).",
      );
      const futureTimeResult = await todoListConcept.recreateRecurringList({
        list: futureEndTimeListId,
      });
      assertEquals(futureTimeResult, {}, "Should return empty success as precondition not met");
      console.log("  recreateRecurringList did not fire for list with future end time.");

      const listsAfterFutureTime = await todoListConcept.getListsForUser({
        user: userA,
      });
      assert(
        !listsAfterFutureTime.lists.some((l) =>
          l.name === "Future Recurring List" && l._id !== futureEndTimeListId
        ),
        "No new list should be created for future recurring list",
      );
      console.log("  Verified no new list created when end time is in the future.");
    },
  );

  await test.step(
    "10. Queries: getListsForUser, getListByName, getActiveListsForUser",
    async () => {
      console.log("\n--- Testing Queries ---");

      // Setup multiple lists for different users and time states
      await todoListConcept.createList({
        owner: userA,
        name: "UserA List 1",
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      await todoListConcept.createList({
        owner: userA,
        name: "UserA List 2 (Active)",
        startTime: new Date(Date.now() - 10000),
        endTime: new Date(Date.now() + 10000),
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      await todoListConcept.createList({
        owner: userA,
        name: "UserA List 3 (Expired)",
        startTime: new Date(Date.now() - 20000),
        endTime: new Date(Date.now() - 10000),
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      await todoListConcept.createList({
        owner: userA,
        name: "UserA List 4 (Future)",
        startTime: new Date(Date.now() + 10000),
        endTime: new Date(Date.now() + 20000),
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      await todoListConcept.createList({
        owner: userB,
        name: "UserB List 1",
        autoClearCompleted: false,
        recurrenceType: "none",
      });
      console.log("  Created various lists for user A and B.");

      // Test Case 10.1: getListsForUser
      console.log("10.1 Querying for lists for User A.");
      const userAListsResult = await todoListConcept.getListsForUser({
        user: userA,
      });
      assertEquals(
        userAListsResult.lists.length,
        4,
        "User A should have 4 lists",
      );
      assert(
        userAListsResult.lists.every((l) => l.owner === userA),
        "All retrieved lists should belong to User A",
      );
      console.log("  Verified getListsForUser returns correct lists for User A.");

      // Test Case 10.2: getListByName
      console.log("10.2 Querying for 'UserA List 2 (Active)' by name.");
      const specificListResult = await todoListConcept.getListByName({
        user: userA,
        name: "UserA List 2 (Active)",
      });
      assertExists(
        (specificListResult as { list: any }).list,
        "Specific list should be found",
      );
      assertEquals(
        (specificListResult as { list: any }).list.name,
        "UserA List 2 (Active)",
        "Retrieved list name should match",
      );
      console.log("  Verified getListByName retrieves the correct list.");

      console.log("10.3 Querying for a non-existent list by name.");
      const nonExistentListResult = await todoListConcept.getListByName({
        user: userA,
        name: "Non Existent List",
      });
      assertExists(
        (nonExistentListResult as { error: string }).error,
        "Should return error for non-existent list",
      );
      console.log("  Verified getListByName returns error for non-existent list.");

      // Test Case 10.4: getActiveListsForUser
      console.log("10.4 Querying for active lists for User A.");
      const activeListsResult = await todoListConcept.getActiveListsForUser({
        user: userA,
      });
      assertEquals(
        activeListsResult.lists.length,
        2,
        "User A should have 2 active lists (UserA List 1, UserA List 2 (Active))",
      );
      assert(
        activeListsResult.lists.some((l) => l.name === "UserA List 1"),
        "UserA List 1 (no time bounds) should be active",
      );
      assert(
        activeListsResult.lists.some((l) => l.name === "UserA List 2 (Active)"),
        "UserA List 2 (Active) should be active",
      );
      console.log("  Verified getActiveListsForUser returns only active lists.");
    },
  );

  Deno.test("11. Principle: Fulfillment of core scenario", async () => {
    console.log("\n--- Testing Principle Fulfillment ---");
    console.log(
      "Principle: If a user creates a named list with a time range and adds several items to it, they can later retrieve that list by its name and see all the items they added. Items can only be added if they fall within the list's time scope. Lists can automatically clear completed items at the end of their time period, and recurring lists automatically recreate themselves for the next time period.",
    );

    // Scenario Setup: User creates a time-scoped, auto-clearing, daily recurring list.
    const alice: ID = "user:AliceP" as ID;
    const task1: ID = "task:Groceries" as ID;
    const task2: ID = "task:Workout" as ID;
    const task3: ID = "task:ReadBook" as ID;

    const listStartTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const listEndTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago (so it's "expired")

    console.log("11.1 Alice creates a 'Daily Chores' list (time-scoped, auto-clear, daily recurring).");
    const createListResult = await todoListConcept.createList({
      owner: alice,
      name: "Daily Chores",
      startTime: listStartTime,
      endTime: listEndTime,
      autoClearCompleted: true,
      recurrenceType: "daily",
    });
    const dailyChoresListId = (createListResult as { list: ID }).list;
    assertExists(dailyChoresListId, "List should be created");
    console.log(`  Created list '${dailyChoresListId}' with start=${listStartTime.toISOString()}, end=${listEndTime.toISOString()}`);

    // Alice adds items to the list, respecting the time scope
    console.log("11.2 Alice adds items to the 'Daily Chores' list.");
    await todoListConcept.addListItem({
      list: dailyChoresListId,
      item: task1,
      itemDueDate: new Date(listStartTime.getTime() + 1000),
    }); // Within range
    await todoListConcept.addListItem({
      list: dailyChoresListId,
      item: task2,
      itemDueDate: new Date(listEndTime.getTime() - 1000),
    }); // Within range
    await todoListConcept.addListItem({
      list: dailyChoresListId,
      item: task3,
    }); // No due date, added as is

    let currentList = (await todoListConcept.getListByName({
      user: alice,
      name: "Daily Chores",
    }) as { list: any }).list;
    assertEquals(currentList.items.length, 3, "All 3 items should be added.");
    console.log(`  Items '${task1}', '${task2}', '${task3}' added.`);

    // Demonstrate completion and auto-clearing
    console.log("11.3 Alice marks 'Groceries' as completed.");
    await todoListConcept.markItemCompleted({
      list: dailyChoresListId,
      item: task1,
      completed: true,
    });
    currentList = (await todoListConcept.getListByName({
      user: alice,
      name: "Daily Chores",
    }) as { list: any }).list;
    assert(
      currentList.items.find((i: any) => i.id === task1)!.completed,
      "Task 1 should be completed.",
    );
    console.log("  Task 'Groceries' marked completed.");

    // The list's end time is in the past, and autoClearCompleted is true.
    console.log("11.4 System automatically clears completed items (autoClearIfNeeded).");
    await todoListConcept.autoClearIfNeeded({ list: dailyChoresListId });
    currentList = (await todoListConcept.getListByName({
      user: alice,
      name: "Daily Chores",
    }) as { list: any }).list;
    assertEquals(currentList.items.length, 2, "Only 2 items should remain after auto-clear.");
    assert(
      !currentList.items.some((i: any) => i.id === task1),
      "Task 'Groceries' (completed) should be cleared.",
    );
    assert(
      currentList.items.some((i: any) => i.id === task2),
      "Task 'Workout' (uncompleted) should remain.",
    );
    assert(
      currentList.items.some((i: any) => i.id === task3),
      "Task 'ReadBook' (uncompleted) should remain.",
    );
    console.log("  Completed items (Groceries) automatically cleared.");

    // Demonstrate recurrence
    console.log("11.5 System automatically recreates the recurring list for the next period (recreateRecurringList).");
    await todoListConcept.recreateRecurringList({ list: dailyChoresListId });

    // Find the new recurring list
    const aliceLists = await todoListConcept.getListsForUser({ user: alice });
    const newDailyChoresList = aliceLists.lists.find((l: any) =>
      l.name === "Daily Chores" && l._id !== dailyChoresListId
    );
    assertExists(newDailyChoresList, "A new recurring list should be created.");
    console.log(`  New list '${newDailyChoresList!._id}' created.`);

    // Verify properties of the new list and carried-over items
    const expectedNewStartTime = new Date(listEndTime.getTime() + 24 * 60 * 60 * 1000);
    const expectedNewEndTime = new Date(listEndTime.getTime() + 2 * 24 * 60 * 60 * 1000);

    assertEquals(
      newDailyChoresList!.startTime!.toISOString(),
      expectedNewStartTime.toISOString(),
      "New list start time should be adjusted.",
    );
    assertEquals(
      newDailyChoresList!.endTime!.toISOString(),
      expectedNewEndTime.toISOString(),
      "New list end time should be adjusted.",
    );
    assertEquals(
      newDailyChoresList!.items.length,
      2,
      "Only uncompleted items (Workout, ReadBook) should be carried over.",
    );
    assert(
      newDailyChoresList!.items.some((i: any) => i.id === task2),
      "Task 'Workout' carried over and uncompleted.",
    );
    assert(
      newDailyChoresList!.items.some((i: any) => i.id === task3),
      "Task 'ReadBook' carried over and uncompleted.",
    );
    console.log("  New recurring list verified with adjusted times and carried-over uncompleted items.");
    console.log("Principle fulfillment complete.");
  });

  await client.close();
});
```
