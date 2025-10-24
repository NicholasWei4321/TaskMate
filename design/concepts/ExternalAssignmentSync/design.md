# ExternalAssignmentSync - Design Decisions

## Overview
This document explains the key design decisions made during the development of the ExternalAssignmentSync concept.

## Design Decision 1: Generic Platform Support with Concrete Implementation

**Decision**: Design the concept to be platform-agnostic (using generic `sourceType` field) but implement only Canvas API integration initially.

**Rationale**: Each external platform (Canvas, GitHub, Gradescope, Catsoop) has different APIs, authentication methods, and data structures. Attempting to support all platforms simultaneously would be too complex. Canvas serves as proof-of-concept that the synchronization logic works correctly.

## Design Decision 2: Split Sync into Two Actions

**Decision**: Separate external API interaction (`pollExternalSource`) from change detection (`identifyChanges`) instead of combining into single `fetchUpdates` action.

**Rationale**: Follows single responsibility principle. Polling can fail due to network/API issues independently of comparison logic. Separation allows testing and debugging each step independently. Application layer can handle errors differently for fetch failures vs comparison failures.

**Change 1: Simplified Generic Parameters** - Reduced from `[ExternalSourceAccount, ExternalAssignmentId, InternalAssignmentId, ExternalAssignmentDetails, ConnectionDetails]` to just `[User, Assignment]`. Entity types (ExternalSourceAccount) should be managed by the concept, not passed as generic parameters.

**Change 2: Comprehensive Error Handling** - Added error action overloads for all failure modes: `InvalidCredentialsError`, `NetworkError`, `ApiRateLimitError`, `SourceConnectionError`, `DuplicateSourceError`, `SourceNotFound`.

**Change 3: Source Identification** - Added `sourceName` field for user-friendly labels (e.g., "6.104 Canvas") to distinguish multiple sources of same type. Changed uniqueness constraint from `(owner, sourceType, baseUrl)` to `(owner, sourceName)`.

**Change 4: Query Naming Convention** - Prefixed all queries with underscore (`_getSourcesForUser`, `_getMappedInternalId`, `_getAssignmentsForSource`) and made them return arrays per implementation guidelines.

**Change 5: Defensive Error Handling** - Added `SourceNotFound` error returns to `identifyChanges` and `recordInternalSync` actions even though not in original spec. Better to validate preconditions than assume source exists.

## Testing

**Test Coverage**: 9 integration tests using real Canvas API, skipped if `CANVAS_API_TOKEN` not set.

**Approach**: Context's created mock tests with fake Canvas data. I replaced with real Canvas integration tests. Tests validate actual API calls, data structures, and end-to-end workflows rather than simulated behavior.
