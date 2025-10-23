# TodoList - Design Decisions

## Overview
This document explains the key design decisions made during the development of the TodoList concept.

## Design Decision 1: Time Scoping

**Decision**: Gemini did not provide time ranges, but I decided to bring this over from Assignment 2.

**Rationale**: Enables the Assignment 2 use case: "daily todo list" vs "calendar view", allows filtering items by relevance to time period. Can have daily, week,ly, monthly lists, or lists with no time scoping at all.

**Implementation**: `startTime` and `endTime` are optional (nullable) fields, they can be set to the earliest/latest possible times if they are "null".

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
