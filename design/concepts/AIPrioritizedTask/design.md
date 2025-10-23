# AIPrioritizedTask - Design Decisions

## Overview
This document explains the key design decisions made during the development of the AIPrioritizedTask concept.

## Design Decision 1: Combining Task with Priority and Assigner from Assignment 2 and Using  AI-Enhanced Task Management from Assignment 3

**Decision**: Keep task management, AI estimation, and priority calculation within a single concept rather than splitting into separate Task, Estimation, and Ranking concepts.

**Rationale**:
- Allows us to reuse existing work from `intro-gemini-schedule` assignment
- Simplifies the implementation for the MVP
- The AI prioritization is fundamentally tied to task-specific attributes (due date, description)
- Reduces coordination complexity between concepts

**Trade-offs**:
- Less modular than splitting into three separate concepts
- Makes the concept less reusable for non-task items
- However, for this specific use case (task management), the integration provides better cohesion

## Design Decision 2: Optional AI Attributes with Fallback

**Decision**: AI-inferred attributes (effort, importance, difficulty) are nullable/optional fields, with automatic fallback to time-based priority when AI fails.

**Rationale**:
- Ensures system remains functional even when LLM is unavailable or returns invalid data
- Provides graceful degradation of functionality
- Validation can fail without breaking the user experience
- Time-based urgency is always calculable from the due date

**Implementation**:
- `inferredEffortHours`, `inferredImportance`, `inferredDifficulty` are optional (Number?)
- `_calculatePriorityScore` checks if AI attributes are null before using them
- If null, only `baseUrgency` (time-based) contributes to `priorityScore`

## Design Decision 3: System Actions for Automated Priority Updates

**Decision**: Include system actions (`_triggerAIPriorityCalculation`, `_calculatePriorityScore`, `_monitorTasksForTimeEvents`) that run automatically.

**Rationale**:
- Priority needs to update as time passes, even without user interaction
- Overdue status must be automatically set when due date is reached
- Snoozed tasks need to become active again when snooze period ends
- Separating calculation logic from user actions allows for consistency

**Implementation**:
- `_monitorTasksForTimeEvents`: Periodic system action that checks all incomplete tasks
- `_triggerAIPriorityCalculation`: Handles LLM calls and updates inferred attributes
- `_calculatePriorityScore`: Pure calculation logic combining time urgency + AI scores

## Design Decision 4: Dual Priority Calculation Formula

**Decision**: Priority score combines base urgency (time-based) with AI score (weighted attributes).

**Formula**:
```
priorityScore = baseUrgency + aiScore

baseUrgency = {
  1000                    if overdue
  500 + proximity_bonus   if due within 24 hours
  100 + gradual_increase  if due later
  -100                    if snoozed
  50                      if no due date
}

aiScore = (importance * 5) + (difficulty * 3) + (1/effort * 10)
```

**Rationale**:
- Time urgency provides the foundation (always present)
- AI attributes amplify or adjust the priority
- Overdue tasks always rank highest
- Importance weighted most heavily (5x), as critical tasks should surface
- Difficulty weighted moderately (3x), as harder tasks need more attention
- Effort inversely weighted (1/effort), so quick wins get a small boost
- Snoozed tasks get negative urgency to sink them in rankings

**Trade-offs**:
- Formula coefficients are somewhat arbitrary and may need tuning
- Could make weights configurable per user in future iterations

## Design Decision 5: Snooze Resets Overdue Status

**Decision**: When a task is snoozed, its `overdue` flag is set to false.

**Rationale**:
- User explicitly deferred the task, acknowledging they missed the original deadline
- Prevents snoozed tasks from staying "overdue" indefinitely
- Gives users a fresh start after snoozing
- New urgency will be based on the snooze date, not the original due date

**Alternative Considered**: Keep overdue flag but adjust priority formula
- Rejected because it creates confusing UX (task shows "overdue" but user just snoozed it)

## Design Decision 6: Tracking Last Inference Attempt

**Decision**: Include `lastInferenceAttempt` timestamp field to track when LLM was last called.

**Rationale**:
- Enables future functionality like periodic re-inference of attributes
- Helps debug LLM integration issues
- Prevents excessive API calls by knowing when last attempt was made
- Could implement rate limiting or caching strategies based on this

**Future Use Cases**:
- Only re-run LLM if description changed significantly
- Periodic background refresh of attributes for long-running tasks
- Analytics on LLM success rates

## Design Decision 7: Optional Due Date

**Decision**: `dueDate` is optional (DateTime?) rather than required.

**Rationale**:
- Some tasks are ongoing or don't have strict deadlines (e.g., "Learn Spanish")
- Allows flexibility in task creation
- Tasks without due dates get low base urgency (50) but can still benefit from AI prioritization

**Implementation Impact**:
- Priority calculation must handle null due dates
- Such tasks rely more heavily on AI attributes for ranking

## Design Decision 8: Clear Inferred Attributes on Completion

**Decision**: When a task is marked complete, set all AI-inferred attributes to null.

**Rationale**:
- Completed tasks don't need prioritization anymore
- Reduces storage overhead for completed tasks
- Prevents confusion if task is "uncompleted" in future
- Priority score is set to 0 for completed tasks anyway

## Challenges & Solutions

### Challenge 1: LLM Validation
**Problem**: LLM might return invalid or out-of-range values.

**Solution**:
- Validation logic in `_triggerAIPriorityCalculation`
- If invalid, set attributes to null (triggers fallback)
- This will be implemented in the actual code with specific validators

### Challenge 2: Real-time Priority Updates
**Problem**: Priority should change as time passes, but we can't run continuous updates.

**Solution**:
- `_monitorTasksForTimeEvents` runs periodically (e.g., every minute)
- Recalculates priority for all incomplete tasks
- In practice, priority could also be calculated on-demand when viewing task list

### Challenge 3: Reusing Existing Code
**Problem**: Need to adapt `intro-gemini-schedule` code to concept backend structure.

**Solution**:
- Keep same core logic and formulas
- Adapt to MongoDB instead of in-memory storage
- Use Deno instead of Node.js
- Follow concept backend patterns (generic parameters, etc.)

## Evolution from Previous Work

This concept builds on the `Task` and `AIPrioritizedTask` concepts from the `intro-gemini-schedule` assignment:

**Preserved**:
- Core task attributes (name, description, dueDate, completed, overdue)
- AI inference for effort, importance, difficulty
- Validation with fallback to time-based priority
- Basic task operations (create, snooze, complete, markLate)

**Enhanced**:
- More sophisticated state model with system actions
- Explicit tracking of inference attempts
- Automated monitoring and priority updates
- Better separation of calculation logic
- Support for tasks without due dates

**Adapted for Concept Backend**:
- Generic User parameter
- Formal state/action specifications
- MongoDB-compatible structure (to be implemented)
- Deno runtime compatibility (to be implemented)

## Future Enhancements

Potential improvements for future iterations:

1. **User-Configurable Priority Weights**: Let users adjust importance/difficulty/effort coefficients
2. **Smart Re-inference**: Only call LLM when description changes significantly
3. **Batch LLM Calls**: Process multiple tasks in a single API call
4. **Historical Tracking**: Keep history of priority changes over time
5. **Calibration Learning**: Adjust AI weights based on user's actual completion patterns
6. **Context-Aware Inference**: Pass user's past task data to LLM for better estimates
