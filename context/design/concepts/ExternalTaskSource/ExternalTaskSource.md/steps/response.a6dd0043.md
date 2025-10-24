---
timestamp: 'Thu Oct 23 2025 20:06:08 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_200608.2a80b6a7.md]]'
content_id: a6dd00433aed7d0434e071bba31a15b4ebc60e2bc43c088bb2fafb987a683ce6
---

# response:

Here is a concept specification for synchronizing assignments from external platforms:

***

**concept** ExternalAssignmentSync \[ExternalSourceAccount, ExternalAssignmentId, InternalAssignmentId, ExternalAssignmentDetails, ConnectionDetails]

**purpose** Enable users to seamlessly integrate and manage assignments from external platforms within the application, ensuring consistency and preventing redundant data through tracking and selective updates.

**principle** If a user connects an external assignment source with their credentials and initiates an import, then the assignments from that source will be fetched and identified for creation or update within the application. Furthermore, if the user later refreshes the connection, the system will identify only new or modified assignments, providing their details for import and ensuring the application's assignment list remains current without creating duplicates.

**state**
// Represents active connections to external platforms and their sync status
a set of ExternalSourceAccounts with
connectionDetails: ConnectionDetails // Generic type for credentials/API keys
lastSuccessfulSync: Timestamp        // Timestamp of the last successful data fetch from this external source

// Maps external assignments to their internal counterparts and tracks their state
a mapping from ExternalAssignmentId to
externalSourceAccount: ExternalSourceAccount      // The source this external assignment belongs to
internalAssignmentId: InternalAssignmentId        // The corresponding internal assignment identifier
lastExternalModificationTimestamp: Timestamp // The timestamp of the assignment's last modification on the external platform, as of the last successful sync

**actions**

connectSource (details: ConnectionDetails): (sourceAccount: ExternalSourceAccount)
**purpose** Establishes a new connection to an external platform using provided credentials.
**requires** The `details` are valid and allow successful authentication with the external platform.
**effects**
A new unique `ExternalSourceAccount` identifier is generated and returned.
The new `ExternalSourceAccount` is added to the concept's state, storing its `connectionDetails`.
`lastSuccessfulSync` for the new `sourceAccount` is initialized to an appropriate default (e.g., null or epoch).

disconnectSource (sourceAccount: ExternalSourceAccount)
**purpose** Removes an existing connection to an external platform and all its associated assignment mappings.
**requires** `sourceAccount` exists in the concept's state.
**effects**
The `sourceAccount` and its `connectionDetails` are removed from the concept's state.
All mappings from `ExternalAssignmentId` to `InternalAssignmentId` that are associated with the `sourceAccount` are removed.

fetchUpdates (sourceAccount: ExternalSourceAccount): (assignmentsToProcess: set of { externalId: ExternalAssignmentId, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp, existingInternalId: InternalAssignmentId | null })
**purpose** Fetches assignments from a connected external platform, identifies new or updated ones based on prior syncs, and provides the necessary data for the application to process.
**requires** `sourceAccount` exists in the concept's state and its `connectionDetails` are valid and functional for accessing the external platform.
**effects**
Connects to the external platform using `sourceAccount.connectionDetails`.
Retrieves the current list of assignments from the external platform, including their unique identifiers and their latest modification timestamps.
For each external assignment retrieved:
If `externalId` is not currently mapped in the state, OR if its `externalModificationTimestamp` from the external source is newer than the stored `mapping[externalId].lastExternalModificationTimestamp`:
The assignment details are added to the `assignmentsToProcess` result.
`existingInternalId` is set to the currently mapped `InternalAssignmentId` for `externalId` if it exists, otherwise `null`.
`sourceAccount.lastSuccessfulSync` is updated to the current time.

recordInternalSync (sourceAccount: ExternalSourceAccount, externalId: ExternalAssignmentId, internalId: InternalAssignmentId, externalModificationTimestamp: Timestamp)
**purpose** Records that an external assignment has been successfully processed by the application (either created or updated) and mapped to an internal assignment, along with its latest external modification timestamp.
**requires** `sourceAccount` exists in the concept's state.
**effects**
The mapping for `externalId` for the given `sourceAccount` is created or updated to point to `internalId`.
The `lastExternalModificationTimestamp` for this mapping is updated to the provided `externalModificationTimestamp`.

**queries**

getMappedInternalId (externalId: ExternalAssignmentId, sourceAccount: ExternalSourceAccount): (internalId: InternalAssignmentId)
**purpose** Retrieves the internal assignment ID corresponding to a given external assignment ID and source.
**requires** `externalId` is mapped in the state for the given `sourceAccount`.
**effects** Returns the `internalAssignmentId` associated with `externalId` and `sourceAccount`.

getAssignmentsForSource (sourceAccount: ExternalSourceAccount): (externalId: ExternalAssignmentId)
**purpose** Retrieves all external assignment IDs currently mapped for a specific external source account.
**requires** `sourceAccount` exists in the concept's state.
**effects** Returns a set of all `ExternalAssignmentId`s associated with `sourceAccount`.

***
