---
timestamp: 'Mon Nov 03 2025 15:32:00 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251103_153200.76408a7c.md]]'
content_id: 2d3a7fb07515b849371cc533861375e3966b9f5fca334a96cc1c9c608443ba7b
---

# API Specification: ExternalAssignmentSync Concept

**Purpose:** Enable users to seamlessly integrate and manage assignments from external platforms within the application, ensuring consistency and preventing redundant data through tracking and selective updates.

***

## API Endpoints

### POST /api/ExternalAssignmentSync/connectSource

**Description:** Establishes a new connection to an external platform for a given user using provided credentials and identification.

**Requirements:**

* No `ExternalSourceAccount` already exists for the `owner` with the same `sourceName`.
* The `details` are valid and allow successful authentication with the external platform API.
* (Implicit for error cases) The provided `details` do NOT allow successful authentication with the external platform.
* (Implicit for error cases) A network error occurs while attempting to validate `details`.
* (Implicit for error cases) An `ExternalSourceAccount` already exists for the `owner` with the same `sourceName`.

**Effects:**

* A new unique `ExternalSourceAccount` identifier is generated and returned.
* The new `ExternalSourceAccount` is added to the concept's state, storing its `owner`, `sourceType`, `sourceName`, and `connectionDetails`.
* `lastSuccessfulPoll` for the new `sourceAccount` is initialized to `null`.
* (Implicit for error cases) Returns an `InvalidCredentialsError`.
* (Implicit for error cases) Returns a `NetworkError`.
* (Implicit for error cases) Returns a `DuplicateSourceError`.

**Request Body:**

```json
{
  "owner": "string",
  "sourceType": "string",
  "sourceName": "string",
  "details": {
    "apiToken": "string",
    "baseUrl": "string"
  }
}
```

**Success Response Body (Action):**

```json
{
  "sourceAccount": "string"
}
```

**Error Response Body:**

```json
{
  "error": "InvalidCredentialsError"
}
```

*Or:*

```json
{
  "error": "NetworkError"
}
```

*Or:*

```json
{
  "error": "DuplicateSourceError"
}
```

***

### POST /api/ExternalAssignmentSync/disconnectSource

**Description:** Removes an existing connection to an external platform and all its associated assignment mappings.

**Requirements:**

* `sourceAccount` exists in the concept's state.
* (Implicit for error cases) `sourceAccount` does NOT exist in the concept's state.

**Effects:**

* The `sourceAccount` and its associated data (`owner`, `sourceType`, `sourceName`, `connectionDetails`, `lastSuccessfulPoll`) are removed from the concept's state.
* All mappings from `ExternalAssignmentId` to `Assignment` that are associated with the `sourceAccount` are removed.
* (Implicit for error cases) Returns a `SourceNotFound` error.

**Request Body:**

```json
{
  "sourceAccount": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "SourceNotFound"
}
```

***

### POST /api/ExternalAssignmentSync/pollExternalSource

**Description:** Calls the external API to retrieve the current list of assignments from a connected platform.

**Requirements:**

* `sourceAccount` exists in the concept's state.
* `sourceAccount.connectionDetails` are valid and functional for accessing the external platform.
* (Implicit for error cases) `sourceAccount` exists and a network error occurs during the external API call.
* (Implicit for error cases) `sourceAccount` exists and the external API returns a rate limit error.
* (Implicit for error cases) `sourceAccount` exists and the external API call fails due to invalid credentials or similar connection issues.

**Effects:**

* Connects to the external platform using `sourceAccount.connectionDetails`.
* Retrieves the current list of assignments from the external platform, including their unique identifiers (`externalId`), their full details (`details`), and their latest modification timestamps (`externalModificationTimestamp`).
* `sourceAccount.lastSuccessfulPoll` is updated to the current time.
* Returns the raw list of assignments.
* (Implicit for error cases) Returns a `NetworkError`.
* (Implicit for error cases) Returns an `ApiRateLimitError`.
* (Implicit for error cases) Returns a `SourceConnectionError`.

**Request Body:**

```json
{
  "sourceAccount": "string"
}
```

**Success Response Body (Action):**

```json
{
  "rawExternalAssignments": [
    {
      "externalId": "string",
      "details": {
        "name": "string",
        "description": "string | null",
        "dueDate": "string | null"
      },
      "externalModificationTimestamp": "string"
    }
  ]
}
```

**Error Response Body:**

```json
{
  "error": "NetworkError"
}
```

*Or:*

```json
{
  "error": "ApiRateLimitError"
}
```

*Or:*

```json
{
  "error": "SourceConnectionError"
}
```

***

### POST /api/ExternalAssignmentSync/identifyChanges

**Description:** Compares newly fetched external assignments against previously recorded state to identify new or updated items.

**Requirements:**

* `sourceAccount` exists in the concept's state.

**Effects:**

* For each external assignment in `rawExternalAssignments`:
  * If no ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`, OR if an ExternalAssignment exists but its `externalModificationTimestamp` is older than the one from `rawExternalAssignments`:
    * The assignment details are added to the `assignmentsToProcess` result.
    * `existingInternalId` is set to the `internalAssignment` from the matching ExternalAssignment if it exists, otherwise `null`.
* Returns the set of assignments identified for processing.

**Request Body:**

```json
{
  "sourceAccount": "string",
  "rawExternalAssignments": [
    {
      "externalId": "string",
      "details": {
        "name": "string",
        "description": "string | null",
        "dueDate": "string | null"
      },
      "externalModificationTimestamp": "string"
    }
  ]
}
```

**Success Response Body (Action):**

```json
{
  "assignmentsToProcess": [
    {
      "externalId": "string",
      "details": {
        "name": "string",
        "description": "string | null",
        "dueDate": "string | null"
      },
      "externalModificationTimestamp": "string",
      "existingInternalId": "string | null"
    }
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExternalAssignmentSync/recordInternalSync

**Description:** Records that an external assignment has been successfully processed by the application (either created or updated) and mapped to an internal assignment, along with its latest external modification timestamp.

**Requirements:**

* `sourceAccount` exists in the concept's state.

**Effects:**

* If an ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`:
  * Updates its `internalAssignment` to `internalId` and `lastExternalModificationTimestamp` to `externalModificationTimestamp`.
* Otherwise:
  * Creates a new ExternalAssignment with `source = sourceAccount`, `externalId = externalId`, `internalAssignment = internalId`, and `lastExternalModificationTimestamp = externalModificationTimestamp`.

**Request Body:**

```json
{
  "sourceAccount": "string",
  "externalId": "string",
  "internalId": "string",
  "externalModificationTimestamp": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExternalAssignmentSync/\_getSourcesForUser

**Description:** Retrieves all external source accounts connected by a specific user.

**Requirements:**

* `user` exists in the system (implicitly, as a generic parameter).

**Effects:**

* Returns an array of all `ExternalSourceAccount` entities where `owner` is `user`.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "owner": "string",
    "sourceType": "string",
    "sourceName": "string",
    "connectionDetails": {
      "apiToken": "string",
      "baseUrl": "string"
    },
    "lastSuccessfulPoll": "string | null"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExternalAssignmentSync/\_getMappedInternalId

**Description:** Retrieves the internal assignment ID corresponding to a given external assignment ID and source.

**Requirements:**

* An ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`.
* (Implicit for error cases) No ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`.

**Effects:**

* Returns the `internalAssignment` from the matching ExternalAssignment.
* (Implicit for error cases) Returns error message "External assignment with ID '...' not found for source '...'".

**Request Body:**

```json
{
  "externalId": "string",
  "sourceAccount": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "internalId": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/ExternalAssignmentSync/\_getAssignmentsForSource

**Description:** Retrieves all external assignments currently synced for a specific external source account.

**Requirements:**

* `sourceAccount` exists in the concept's state.
* (Implicit for error cases) `sourceAccount` does NOT exist in the concept's state.

**Effects:**

* Returns an array of all ExternalAssignments where `source = sourceAccount`.
* (Implicit for error cases) Returns error message "Source account not found".

**Request Body:**

```json
{
  "sourceAccount": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "source": "string",
    "externalId": "string",
    "internalAssignment": "string",
    "lastExternalModificationTimestamp": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
