# TodoList

**concept** TodoList [User, Item]

**purpose** Enable users to organize items into named, time-scoped collections with automatic lifecycle management including clearing completed items and recurring list recreation

**principle** If a user creates a named list with a time range and adds several items to it, they can later retrieve that list by its name and see all the items they added. Items can only be added if they fall within the list's time scope. Lists can automatically clear completed items at the end of their time period, and recurring lists automatically recreate themselves for the next time period.

**state**
a set of Lists with
  name: String
  owner: User
  items: set of Item
  startTime: Time? // Optional time range start
  endTime: Time? // Optional time range end
  autoClearCompleted: Boolean // Whether to auto-clear completed items
  recurrenceType: RecurrenceType // none, daily, weekly, monthly

RecurrenceType = none | daily | weekly | monthly

invariants
  each list name is unique per owner
  if startTime and endTime are both set, startTime must be before or equal to endTime
  if recurrenceType is not none, both startTime and endTime must be set

**actions**

createList (owner: User, name: String, startTime: Time?, endTime: Time?, autoClearCompleted: Boolean, recurrenceType: RecurrenceType): (list: List)
  **requires**
    name is non-empty
    for all existing L in Lists, if L.owner == owner then L.name != name
    if both startTime and endTime are provided, startTime <= endTime
    if recurrenceType is not none, both startTime and endTime must be provided
  **effects**
    A new list is created with the provided name, owner, and settings. If time boundaries are provided, the list is scoped to that time range. The autoClearCompleted flag determines whether completed items are automatically cleared. The recurrenceType determines if and how the list recreates itself. The list starts with an empty set of items and is returned.

createList (owner: User, name: String, startTime: Time?, endTime: Time?, autoClearCompleted: Boolean, recurrenceType: RecurrenceType): (error: String)
  **requires** exists L in Lists such that L.owner == owner and L.name == name
  **effects** returns error message "A list with this name already exists for this user."

addListItem (list: List, item: Item, itemDueDate: Time?)
  **requires**
    list exists
    item is not already in list.items
    if list has startTime and itemDueDate is provided, itemDueDate >= list.startTime
    if list has endTime and itemDueDate is provided, itemDueDate <= list.endTime
  **effects**
    The item is added to the list's set of items. If the list has time constraints and the item has a due date, the item is only added if it falls within the list's time range.

removeListItem (list: List, item: Item)
  **requires** list exists AND item is in list.items
  **effects**
    The item is removed from the list's set of items.

deleteList (list: List)
  **requires** list exists
  **effects**
    The list is removed from the set of all lists.

clearCompletedItems (list: List)
  **requires** list exists
  **effects**
    All items in the list where itemCompleted is true are removed from the list's items set.

updateListSettings (list: List, autoClearCompleted: Boolean?, recurrenceType: RecurrenceType?)
  **requires**
    list exists
    if recurrenceType is provided and is not none, list must have both startTime and endTime
  **effects**
    If autoClearCompleted is provided, the list's autoClearCompleted flag is updated. If recurrenceType is provided, the list's recurrenceType is updated.

**system actions**

autoClearIfNeeded (list: List)
  **requires**
    list exists
    list.autoClearCompleted is true
    current time is after list.endTime
  **effects**
    Removes all items in the list where itemCompleted is true.

recreateRecurringList (list: List)
  **requires**
    list exists
    list.recurrenceType is not none
    current time is after list.endTime
  **effects**
    A new list is created with the same name, owner, autoClearCompleted, and recurrenceType settings. The new list's time range is calculated based on the recurrenceType:
    - daily: new startTime is list.endTime + 1 day, new endTime is list.endTime + 1 day
    - weekly: new startTime is list.endTime + 1 week, new endTime is list.endTime + 1 week
    - monthly: new startTime is list.endTime + 1 month, new endTime is list.endTime + 1 month
    All uncompleted items from the old list are carried over to the new list.The original list remains unchanged (archived).

**queries**

getListsForUser (user: User): (lists: set of List)
  **requires** user is valid
  **effects**
    Returns the set of all lists owned by the specified user.

getListByName (user: User, name: String): (list: List)
  **requires** user is valid, name is non-empty
  **effects**
    Returns the list with the specified name owned by the user, or error if not found.

getActiveListsForUser (user: User): (lists: set of List)
  **requires** user is valid
  **effects**
    Returns the set of all lists owned by the user where current time is between startTime and endTime (or time range is not set).