# TaskMate - Application Design Document

## Overview

TaskMate is an AI-enhanced task management application that combines time-based urgency with AI-inferred task attributes for intelligent prioritization.

**Core Concepts**:
- **[AIPrioritizedTask](concepts/AIPrioritizedTask/AIPrioritizedTask.md)** - Task management with AI-powered priority calculation
- **[TodoList](concepts/TodoList/TodoList.md)** - Organize tasks into named collections
- **[UserAuthentication](concepts/UserAuthentication/UserAuthentication.md)** - User auth and credential storage



## Interesting Moments

### Moment 1: Context Tool Generated Placeholder LLM Implementation

**Context**: Generated implementation from [AIPrioritizedTask specification](concepts/AIPrioritizedTask/AIPrioritizedTask.md)

**What Happened**: When the Context tool generated the TypeScript implementation for AIPrioritizedTask, it created a placeholder `_triggerLLMInference` function that returned mock values instead of actually calling the Gemini API. The generated code had `// TODO: Implement actual LLM integration` comments.

**Challenge**: The auto-generated code couldn't know the specific details of our Gemini LLM integration from the previous assignment (intro-gemini-schedule), including the exact API structure, prompt engineering approach, and response parsing logic.

**Solution**: Manually integrated the real LLM calling code from intro-gemini-schedule:
- Copied `gemini-llm.ts` utility file to the AIPrioritizedTask folder
- Replaced the mock `_triggerLLMInference` with actual Gemini API calls
- Added the `_createAttributePrompt` method with specific prompt engineering for task attribute inference
- Fixed environment variable access for Deno runtime compatibility
- Updated priority calculation weights to match specification (50/30/100 with inverse effort)

**Outcome**: Successfully integrated real AI capabilities while preserving the generated code structure. The implementation now makes actual LLM calls to infer task effort, importance, and difficulty, with proper validation and fallback to time-based priority.

**Lessons Learned**: The Context tool excels at generating correct architectural structure and type signatures from specifications, but domain-specific implementation details (like third-party API integrations) need to be manually added. This hybrid approach—Context for structure, manual for specifics—proved effective.



### Moment 2: Context-Generated Tests Required Manual Corrections

**Context**: [Context-generated Initial Test Cases](../context/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts/20251007_212001.aacd419f.md)

**What Happened**: Context tool generated tests using nested `t.step()` calls within a single `Deno.test()`, but assignment required separate `Deno.test()` calls for each test case, and also some test cases had bugs.

**Challenge**: Generated tests had three bugs: (1) all tests nested in substeps instead of separate, (2) `markOverdue` test incorrectly assumed priority must increase (already high for past dates), (3) `calculateTaskPriority` test compared priority values (could be same if LLM returns identical results), (4) query tests had shared database state conflicts.

**Solution**: Manually separated into 19 independent `Deno.test()` calls. Fixed `markOverdue` to verify overdue flag change and non-zero priority. Fixed `calculateTaskPriority` to compare `lastPriorityCalculationTime` timestamps. Fixed query tests to use unique test users.



### Moment 3: Spec Ambiguity Discovered During Implementation Review

**Context**: [Initial Implementation](../context/design/concepts/TodoList/implementation.md/steps/file.3147a341.md)

**What Happened**: After askign Context to implement the spec, realized `recreateRecurringList` specification was ambiguous, "new startTime is list.endTime + 1 day, new endTime is list.endTime + 1 day" literally meant both times are identical, creating zero-duration lists.

**Solution**: Revised Spec now unambiguous with duration formula documented. All 7 actions (including new markItemCompleted) properly implemented.



### Moment 4: Context-Generated Implementation Included Error Handling Missing from Spec

**Context**: [Additional Error Handling in Initial Implementation](../context/design/concepts/TodoList/implementation.md/steps/file.3147a341.md)

**What Happened**: Context generated TodoList implementation with comprehensive error handling for all actions, but the specification only documented error signatures for `createList`. Had to decide whether to remove error handling from code or add it to spec.

**Solution**: Added error action sections to specification for all 7 actions and 3 queries, documenting when each returns error messages versus success values. (Added at end of spec for clarity)



### Moment 5: Context-Generated TodoList Tests Had Missing Edge Cases

**Context**: [Initial Test Cases](../context/design/concepts/TodoList/testing.md/steps/file.563499c9.md)

**What Happened**: Context generated nested `test.step()` test cases again, just like before, which seems to indicate that Context is unaware of the fact that it needs to produce multiple Deno.test cases. Was also missing a few edge cases, eg. all items completed, weekly/monthly occurence, etc. 

**Solution**: Rewrite to separate `Deno.test()` calls. Added missing edge case tests.
