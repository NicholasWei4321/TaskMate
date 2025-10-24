---
timestamp: 'Thu Oct 23 2025 20:28:22 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_202822.1d308389.md]]'
content_id: 75c28ccfb794199f7812a6613dc0b6b873c18c7a8c6923e5dbef44431b7b10e7
---

# response:

Here is the revised concept specification for `ExternalAssignmentSync`, addressing all the identified issues:

***

**concept** ExternalAssignmentSync \[User, Assignment]

**purpose** Enable users to seamlessly integrate and manage assignments from external platforms within the application, ensuring consistency and preventing redundant data through tracking and selective updates.

**principle** If a user connects an external assignment source with their credentials, then the system will establish and remember this connection. Subsequently, when the user requests an update, the system will fetch assignments from that source, identify only new or modified assignments based on previous syncs, and provide their details for the application to process (create or update), ensuring the application's assignment list remains current without creating duplicates. If the user later revokes access or removes the connection, all associated external assignments will be delinked from their internal counterparts.

**state**

// Defines the specific structure for connection details, e.g., for Canvas
// For other sources (e.g., GitHub Classroom), this would be extended or a union type
type ConnectionDetails = {
apiToken: String, // e.g., Canvas API token
baseUrl: URLString  // e.g., "https://canvas.instructure.com"
}

// Represents active connections to external platforms, associated with a user
a set of ExternalSourceAccounts with
owner: User               // The user who owns this connection
sourceType: String        // e.g., "Canvas", "GitHub Classroom"
sourceName: String        // User-friendly label for this connection, e.g., "6.104 Canvas"
connectionDetails: ConnectionDetails // Specific credentials and endpoint info
lastSuccessfulPoll: Timestamp // Timestamp of the last successful data fetch from this external source

// Maps external assignments to their internal counterparts and tracks their state
a set of ExternalAssignments with
source: ExternalSourceAccount                     // The source this external assignment belongs to
externalId: String                                // External assignment ID from the platform (e.g., Canvas assignment ID)
internalAssignment: Assignment                    // The corresponding internal assignment identifier (generic param)
lastExternalModificationTimestamp: Timestamp      // The timestamp of the assignment's last modification on the external platform, as of the last successful sync

**actions**

connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (sourceAccount: ExternalSourceAccount)
**purpose** Establishes a new connection to an external platform for a given user using provided credentials and identification.
**requires**
No `ExternalSourceAccount` already exists for the `owner` with the same `sourceType` and `details.baseUrl`.
The `details` are valid and allow successful authentication with the external platform API.
**effects**
A new unique `ExternalSourceAccount` identifier is generated and returned.
The new `ExternalSourceAccount` is added to the concept's state, storing its `owner`, `sourceType`, `sourceName`, and `connectionDetails`.
`lastSuccessfulPoll` for the new `sourceAccount` is initialized to `null`.

connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: InvalidCredentialsError)
**purpose** Reports failure if the provided connection details are invalid.
**requires** The provided `details` do NOT allow successful authentication with the external platform.
**effects** Returns an `InvalidCredentialsError`.

connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: NetworkError)
**purpose** Reports failure if there's a network issue preventing connection to the external platform.
**requires** A network error occurs while attempting to validate `details`.
**effects** Returns a `NetworkError`.

connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: DuplicateSourceError)
**purpose** Reports failure if an identical source connection already exists for the user.
**requires** An `ExternalSourceAccount` already exists for the `owner` with the same `sourceType` and `details.baseUrl`.
**effects** Returns a `DuplicateSourceError`.

disconnectSource (sourceAccount: ExternalSourceAccount)
**purpose** Removes an existing connection to an external platform and all its associated assignment mappings.
**requires** `sourceAccount` exists in the concept's state.
**effects**
The `sourceAccount` and its associated data (`owner`, `sourceType`, `sourceName`, `connectionDetails`, `lastSuccessfulPoll`) are removed from the concept's state.
All mappings from `ExternalAssignmentId` to `Assignment` that are associated with the `sourceAccount` are removed.

disconnectSource (sourceAccount: ExternalSourceAccount): (error: SourceNotFound)
**purpose** Reports failure if the specified source account does not exist.
**requires** `sourceAccount` does NOT exist in the concept's state.
**effects** Returns a `SourceNotFound` error.

pollExternalSource (sourceAccount: ExternalSourceAccount): (rawExternalAssignments: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp })
**purpose** Calls the external API to retrieve the current list of assignments from a connected platform.
**requires**
`sourceAccount` exists in the concept's state.
`sourceAccount.connectionDetails` are valid and functional for accessing the external platform.
**effects**
Connects to the external platform using `sourceAccount.connectionDetails`.
Retrieves the current list of assignments from the external platform, including their unique identifiers (`externalId`), their full details (`details`), and their latest modification timestamps (`externalModificationTimestamp`).
`sourceAccount.lastSuccessfulPoll` is updated to the current time.
Returns the raw list of assignments.

pollExternalSource (sourceAccount: ExternalSourceAccount): (error: NetworkError)
**purpose** Reports failure due to network issues during polling.
**requires** `sourceAccount` exists and a network error occurs during the external API call.
**effects** Returns a `NetworkError`.

pollExternalSource (sourceAccount: ExternalSourceAccount): (error: ApiRateLimitError)
**purpose** Reports failure due to external API rate limits.
**requires** `sourceAccount` exists and the external API returns a rate limit error.
**effects** Returns an `ApiRateLimitError`.

pollExternalSource (sourceAccount: ExternalSourceAccount): (error: SourceConnectionError)
**purpose** Reports failure if the source account's credentials are no longer valid or the connection details are otherwise dysfunctional.
**requires** `sourceAccount` exists and the external API call fails due to invalid credentials or similar connection issues.
**effects** Returns a `SourceConnectionError`.

identifyChanges (sourceAccount: ExternalSourceAccount, rawExternalAssignments: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp }): (assignmentsToProcess: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp, existingInternalId: Assignment | null })
**purpose** Compares newly fetched external assignments against previously recorded state to identify new or updated items.
**requires** `sourceAccount` exists in the concept's state.
**effects**
For each external assignment in `rawExternalAssignments`:
If no ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`, OR if an ExternalAssignment exists but its `externalModificationTimestamp` is older than the one from `rawExternalAssignments`:
The assignment details are added to the `assignmentsToProcess` result.
`existingInternalId` is set to the `internalAssignment` from the matching ExternalAssignment if it exists, otherwise `null`.
Returns the set of assignments identified for processing.

recordInternalSync (sourceAccount: ExternalSourceAccount, externalId: String, internalId: Assignment, externalModificationTimestamp: Timestamp)
**purpose** Records that an external assignment has been successfully processed by the application (either created or updated) and mapped to an internal assignment, along with its latest external modification timestamp.
**requires** `sourceAccount` exists in the concept's state.
**effects**
If an ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`:
Updates its `internalAssignment` to `internalId` and `lastExternalModificationTimestamp` to `externalModificationTimestamp`.
Otherwise:
Creates a new ExternalAssignment with `source = sourceAccount`, `externalId = externalId`, `internalAssignment = internalId`, and `lastExternalModificationTimestamp = externalModificationTimestamp`.

**queries**

getSourcesForUser (user: User): (sourceAccount: ExternalSourceAccount)
**purpose** Retrieves all external source accounts connected by a specific user.
**requires** `user` exists in the system (implicitly, as a generic parameter).
**effects** Returns a set of all `ExternalSourceAccount` entities where `owner` is `user`.

getMappedInternalId (externalId: String, sourceAccount: ExternalSourceAccount): (internalId: Assignment)
**purpose** Retrieves the internal assignment ID corresponding to a given external assignment ID and source.
**requires** An ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`.
**effects** Returns the `internalAssignment` from the matching ExternalAssignment.

getAssignmentsForSource (sourceAccount: ExternalSourceAccount): (externalAssignment: ExternalAssignment)
**purpose** Retrieves all external assignments currently synced for a specific external source account.
**requires** `sourceAccount` exists in the concept's state.
**effects** Returns a set of all ExternalAssignments where `source = sourceAccount`.

***
