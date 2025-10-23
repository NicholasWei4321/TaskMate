Operational Principle: Create time-scoped list with auto-clear and recurrence ...
------- post-test output -------

=== OPERATIONAL PRINCIPLE TEST ===
1. Creating 'Daily Chores' list (time-scoped, auto-clear, daily recurring)
  ✅ Created list with ID: 019a130d-4974-7a9b-b8bf-ee7e5a6aa739
2. Adding items to the list within time scope
  ✅ Added 3 items to list
3. Marking one item as completed
  ✅ Marked task1 as completed
4. System auto-clears completed items
  ✅ Auto-cleared completed items
5. System recreates recurring list for next period
  ✅ Created new recurring list with carried-over items

=== OPERATIONAL PRINCIPLE TEST PASSED ===
----- post-test output end -----
Operational Principle: Create time-scoped list with auto-clear and recurrence ... ok (1s)
Action: createList - Basic list creation ...
------- post-test output -------

=== TEST: createList - Basic Creation ===
  ✅ Created list with ID: 019a130d-4d8f-73ea-a632-251da8abccf7
  ✅ Verified list properties with default dates
----- post-test output end -----
Action: createList - Basic list creation ... ok (625ms)
Action: createList - With time range ...
------- post-test output -------

=== TEST: createList - With Time Range ===
  ✅ Created time-scoped list
  ✅ Verified time scope
----- post-test output end -----
Action: createList - With time range ... ok (814ms)
Action: createList - Duplicate name should fail ...
------- post-test output -------

=== TEST: createList - Duplicate Name ===
  ✅ Prevented duplicate list name
----- post-test output end -----
Action: createList - Duplicate name should fail ... ok (713ms)
Action: createList - Empty name should fail ...
------- post-test output -------

=== TEST: createList - Empty Name ===
  ✅ Prevented empty list name
----- post-test output end -----
Action: createList - Empty name should fail ... ok (578ms)
Action: createList - Start time after end time should fail ...
------- post-test output -------

=== TEST: createList - Invalid Time Range ===
  ✅ Prevented invalid time range
----- post-test output end -----
Action: createList - Start time after end time should fail ... ok (554ms)
Action: createList - Recurring list without time range should fail ...
------- post-test output -------

=== TEST: createList - Recurring Without Time ===
  ✅ Prevented recurring list without time bounds
----- post-test output end -----
Action: createList - Recurring list without time range should fail ... ok (618ms)
Action: addListItem - Successfully add item ...
------- post-test output -------

=== TEST: addListItem - Success ===
  ✅ Added item successfully
----- post-test output end -----
Action: addListItem - Successfully add item ... ok (891ms)
Action: addListItem - Add item without due date ...
------- post-test output -------

=== TEST: addListItem - No Due Date ===
  ✅ Added item without due date
----- post-test output end -----
Action: addListItem - Add item without due date ... ok (831ms)
Action: addListItem - Duplicate item should fail ...
------- post-test output -------

=== TEST: addListItem - Duplicate Item ===
  ✅ Prevented duplicate item
----- post-test output end -----
Action: addListItem - Duplicate item should fail ... ok (730ms)
Action: addListItem - Item due date before list start should fail ...
------- post-test output -------

=== TEST: addListItem - Due Date Before Start ===
  ✅ Prevented item with due date before start
----- post-test output end -----
Action: addListItem - Item due date before list start should fail ... ok (644ms)
Action: addListItem - Item due date after list end should fail ...
------- post-test output -------

=== TEST: addListItem - Due Date After End ===
  ✅ Prevented item with due date after end
----- post-test output end -----
Action: addListItem - Item due date after list end should fail ... ok (718ms)
Action: addListItem - List not found should fail ...
------- post-test output -------

=== TEST: addListItem - List Not Found ===
  ✅ Prevented adding to non-existent list
----- post-test output end -----
Action: addListItem - List not found should fail ... ok (606ms)
Action: removeListItem - Successfully remove item ...
------- post-test output -------

=== TEST: removeListItem - Success ===
  ✅ Removed item successfully
----- post-test output end -----
Action: removeListItem - Successfully remove item ... ok (715ms)
Action: removeListItem - Item not in list should fail ...
------- post-test output -------

=== TEST: removeListItem - Item Not Found ===
  ✅ Prevented removing non-existent item
----- post-test output end -----
Action: removeListItem - Item not in list should fail ... ok (844ms)
Action: markItemCompleted - Mark as completed and uncompleted ...
------- post-test output -------

=== TEST: markItemCompleted - Toggle Completion ===
  ✅ Marked item as completed
  ✅ Marked item as uncompleted
----- post-test output end -----
Action: markItemCompleted - Mark as completed and uncompleted ... ok (862ms)
Action: markItemCompleted - Item not in list should fail ...
------- post-test output -------

=== TEST: markItemCompleted - Item Not Found ===
  ✅ Prevented marking non-existent item
----- post-test output end -----
Action: markItemCompleted - Item not in list should fail ... ok (689ms)
Action: deleteList - Successfully delete list ...
------- post-test output -------

=== TEST: deleteList - Success ===
  ✅ Deleted list successfully
----- post-test output end -----
Action: deleteList - Successfully delete list ... ok (644ms)
Action: deleteList - Non-existent list should fail ...
------- post-test output -------

=== TEST: deleteList - Not Found ===
  ✅ Prevented deleting non-existent list
----- post-test output end -----
Action: deleteList - Non-existent list should fail ... ok (668ms)
Action: clearCompletedItems - Clear mixed completed/uncompleted items ...
------- post-test output -------

=== TEST: clearCompletedItems - Mixed Items ===
  ✅ Cleared completed items
----- post-test output end -----
Action: clearCompletedItems - Clear mixed completed/uncompleted items ... ok (979ms)
Action: clearCompletedItems - All items completed ...
------- post-test output -------

=== TEST: clearCompletedItems - All Completed ===
  ✅ Cleared all items when all completed
----- post-test output end -----
Action: clearCompletedItems - All items completed ... ok (881ms)
Action: clearCompletedItems - No items completed (harmless) ...
------- post-test output -------

=== TEST: clearCompletedItems - None Completed ===
  ✅ No change when no items completed (harmless operation)
----- post-test output end -----
Action: clearCompletedItems - No items completed (harmless) ... ok (756ms)
Action: updateListSettings - Update autoClearCompleted ...
------- post-test output -------

=== TEST: updateListSettings - Update autoClearCompleted ===
  ✅ Updated autoClearCompleted
----- post-test output end -----
Action: updateListSettings - Update autoClearCompleted ... ok (818ms)
Action: updateListSettings - Update recurrenceType ...
------- post-test output -------

=== TEST: updateListSettings - Update recurrenceType ===
  ✅ Updated recurrenceType
----- post-test output end -----
Action: updateListSettings - Update recurrenceType ... ok (775ms)
Action: updateListSettings - Update both settings at once ...
------- post-test output -------

=== TEST: updateListSettings - Update Both ===
  ✅ Updated both settings simultaneously
----- post-test output end -----
Action: updateListSettings - Update both settings at once ... ok (873ms)
Action: updateListSettings - Recurring without time bounds should fail ...
------- post-test output -------

=== TEST: updateListSettings - Recurring Without Time ===
  ✅ Prevented setting recurrence without time bounds
----- post-test output end -----
Action: updateListSettings - Recurring without time bounds should fail ... ok (612ms)
System Action: autoClearIfNeeded - Precondition met, clears items ...
------- post-test output -------

=== TEST: autoClearIfNeeded - Clears Items ===
  ✅ Auto-cleared completed items
----- post-test output end -----
System Action: autoClearIfNeeded - Precondition met, clears items ... ok (916ms)
System Action: autoClearIfNeeded - autoClearCompleted false, no action ...
------- post-test output -------

=== TEST: autoClearIfNeeded - Flag False ===
  ✅ No action when autoClearCompleted is false
----- post-test output end -----
System Action: autoClearIfNeeded - autoClearCompleted false, no action ... ok (964ms)
System Action: autoClearIfNeeded - End time in future, no action ...
------- post-test output -------

=== TEST: autoClearIfNeeded - Future End Time ===
  ✅ No action when end time in future
----- post-test output end -----
System Action: autoClearIfNeeded - End time in future, no action ... ok (750ms)
System Action: recreateRecurringList - Daily recurrence ...
------- post-test output -------

=== TEST: recreateRecurringList - Daily ===
  ✅ Daily recurring list created with correct duration
----- post-test output end -----
System Action: recreateRecurringList - Daily recurrence ... ok (931ms)
System Action: recreateRecurringList - Weekly recurrence ...
------- post-test output -------

=== TEST: recreateRecurringList - Weekly ===
  ✅ Weekly recurring list created with correct duration
----- post-test output end -----
System Action: recreateRecurringList - Weekly recurrence ... ok (704ms)
System Action: recreateRecurringList - Monthly recurrence ...
------- post-test output -------

=== TEST: recreateRecurringList - Monthly ===
  ✅ Monthly recurring list created with correct duration
----- post-test output end -----
System Action: recreateRecurringList - Monthly recurrence ... ok (760ms)
System Action: recreateRecurringList - recurrenceType none, no action ...
------- post-test output -------

=== TEST: recreateRecurringList - None Type ===
  ✅ No action for non-recurring list
----- post-test output end -----
System Action: recreateRecurringList - recurrenceType none, no action ... ok (665ms)
System Action: recreateRecurringList - End time in future, no action ...
------- post-test output -------

=== TEST: recreateRecurringList - Future End ===
  ✅ No action when end time in future
----- post-test output end -----
System Action: recreateRecurringList - End time in future, no action ... ok (639ms)
Query: getListsForUser - Returns all lists for user ...
------- post-test output -------

=== TEST: getListsForUser ===
  ✅ Retrieved all lists for user
----- post-test output end -----
Query: getListsForUser - Returns all lists for user ... ok (946ms)
Query: getListByName - Returns specific list ...
------- post-test output -------

=== TEST: getListByName - Success ===
  ✅ Retrieved specific list by name
----- post-test output end -----
Query: getListByName - Returns specific list ... ok (672ms)
Query: getListByName - Non-existent list returns error ...
------- post-test output -------

=== TEST: getListByName - Not Found ===
  ✅ Error returned for non-existent list
----- post-test output end -----
Query: getListByName - Non-existent list returns error ... ok (757ms)
Query: getActiveListsForUser - Returns only active lists ...
------- post-test output -------

=== TEST: getActiveListsForUser ===
  ✅ Retrieved only active lists
----- post-test output end -----
Query: getActiveListsForUser - Returns only active lists ... ok (757ms)