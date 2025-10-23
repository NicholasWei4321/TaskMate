# TodoList - Design Decisions

## Overview
This document explains the key design decisions made during the development of the TodoList concept.

## Design Decision 1: Time Scoping with Default Dates

**Decision**: Lists always have `startTime` and `endTime` fields. When not explicitly provided, they default to MIN_DATE (Unix epoch: Jan 1, 1970) and MAX_DATE (Dec 31, 9999).

**Rationale**: Enables the Assignment 2 use case: "daily todo list" vs "calendar view", allows filtering items by relevance to time period. Can have daily, weekly, monthly lists, or timeless lists that are always active. Using always-present dates (with defaults) simplifies MongoDB queries and type safety compared to nullable fields.

**Implementation**: `startTime` and `endTime` are required fields (not optional). Lists created without dates get MIN_DATE/MAX_DATE defaults. Recurring lists must have explicit (non-default) dates. Query for active lists uses simple `startTime <= now <= endTime` comparison.

## Design Decision 2: Auto-Clear Completed Items

**Decision**: Add `autoClearCompleted` flag and system action to automatically remove completed items when time period ends.

**Rationale**: Keeps daily lists "fresh" by clearing completed items. Distinguishes lists from simple tags (lists have lifecycle behavior). From Assignment 2 `endOfDayClear` sync.

**Implementation**: System action `autoClearIfNeeded` triggers when `current time > endTime`. Redundant clears are harmless.

## Design Decision 3: Recurring Lists

**Decision**: Add `recurrenceType` field (daily/weekly/monthly) and automatic list recreation.

**Rationale**: Reduces manual overhead - user creates "Today" list once, it recreates automatically. Old lists preserved for history.

**Implementation**: System action `recreateRecurringList` creates new list with advanced time range. Uncompleted items carry over to new list (bypassing time constraints).

## Design Decision 4: Generic Item Parameter

**Decision**: Parameterize TodoList by both User and Item: `TodoList[User, Item]`

**Rationale**: Makes the concept reusable for any type of item, not just tasks

**Implementation**: Lists contain `set of Item` rather than specific task objects, no assumptions about Item structure or methods

## Implementation Fixes

During implementation review against the specification, the following bugs and improvements were identified and corrected:

**Fix 1: Query Method Naming** - Removed underscore prefix from `_getListsForUser`, `_getListByName`, `_getActiveListsForUser` to match specification (queries should be public methods).

**Fix 2: Missing markItemCompleted Action** - Added `markItemCompleted(list, item, completed)` action to set item completion status (spec referenced `itemCompleted` but had no action to modify it).

**Fix 3: recreateRecurringList Duration Bug** - Fixed zero-duration bug where new lists had identical start and end times; now correctly maintains original list duration by calculating `newEndTime = newStartTime + (oldEndTime - oldStartTime)`.

**Fix 4: Type Error with Null Date Queries** - MongoDB query used `{ startTime: null, endTime: null }` which TypeScript rejected. Changed to always-present dates with MIN_DATE/MAX_DATE defaults, simplifying both type checking and query logic.
