// src/concepts/ExternalAssignmentSyncConcept.ts
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { validateCanvasCredentials, fetchCanvasAssignments } from "./canvas-api.ts";

// Declare collection prefix, use concept name
const PREFIX = "ExternalAssignmentSync" + ".";

// Generic types of this concept
type User = ID; // The user who owns the external source account
type Assignment = ID; // The internal assignment ID in the application

// --- Error Types ---
// As per the specification's examples, errors are returned as an object with an 'error' field.
type InvalidCredentialsError = { error: string };
type NetworkError = { error: string };
type DuplicateSourceError = { error: string };
type SourceNotFound = { error: string };
type ApiRateLimitError = { error: string };
type SourceConnectionError = { error: string };

// --- State Interfaces ---

/**
 * Defines the specific structure for connection details, e.g., for Canvas
 * For other sources (e.g., GitHub Classroom), this would be extended or a union type
 */
interface ConnectionDetails {
  apiToken: string; // e.g., Canvas API token
  baseUrl: string; // e.g., "https://canvas.instructure.com" (using string for URLString)
}

/**
 * Defines the structure of assignment data from external platforms
 */
interface ExternalAssignmentDetails {
  name: string;
  description?: string; // Assignment description (may be null)
  dueDate?: number; // Due date (Timestamp is number, milliseconds since epoch)
}

/**
 * Represents active connections to external platforms, associated with a user
 * a set of ExternalSourceAccounts with
 * owner: User
 * sourceType: String
 * sourceName: String
 * connectionDetails: ConnectionDetails
 * lastSuccessfulPoll: Timestamp
 */
interface ExternalSourceAccountDoc {
  _id: ID; // Unique identifier for this external source account
  owner: User; // The user who owns this connection
  sourceType: string; // e.g., "Canvas", "GitHub Classroom"
  sourceName: string; // User-friendly label for this connection, e.g., "6.104 Canvas"
  connectionDetails: ConnectionDetails; // Specific credentials and endpoint info
  lastSuccessfulPoll?: number; // Timestamp of the last successful data fetch from this external source
}

/**
 * Maps external assignments to their internal counterparts and tracks their state
 * a set of ExternalAssignments with
 * source: ExternalSourceAccount
 * externalId: String
 * internalAssignment: Assignment
 * lastExternalModificationTimestamp: Timestamp
 */
interface ExternalAssignmentDoc {
  _id: ID; // Unique identifier for this external assignment mapping
  source: ID; // References ExternalSourceAccountDoc._id
  externalId: string; // External assignment ID from the platform (e.g., Canvas assignment ID)
  internalAssignment: Assignment; // The corresponding internal assignment identifier (generic param)
  lastExternalModificationTimestamp: number; // The timestamp of the assignment's last modification on the external platform, as of the last successful sync
}

// --- Action/Query Argument and Return Types for clarity ---

// connectSource argument type
type ConnectSourceArgs = {
  owner: User;
  sourceType: string;
  sourceName: string;
  details: ConnectionDetails;
};
// connectSource success return type
type ConnectSourceSuccess = { sourceAccount: ID };

// pollExternalSource raw assignment structure
type RawExternalAssignment = {
  externalId: string;
  details: ExternalAssignmentDetails;
  externalModificationTimestamp: number;
};
// pollExternalSource success return type
type PollExternalSourceSuccess = { rawExternalAssignments: RawExternalAssignment[] };

// identifyChanges assignment to process structure
type AssignmentToProcess = {
  externalId: string;
  details: ExternalAssignmentDetails;
  externalModificationTimestamp: number;
  existingInternalId: Assignment | null;
};
// identifyChanges success return type
type IdentifyChangesSuccess = { assignmentsToProcess: AssignmentToProcess[] };

// _getSourcesForUser success return type
type GetSourcesForUserSuccess = { sources: ExternalSourceAccountDoc[] };

// _getMappedInternalId success return type
type GetMappedInternalIdSuccess = { internalId: Assignment };

// _getAssignmentsForSource success return type
type GetAssignmentsForSourceSuccess = { assignments: ExternalAssignmentDoc[] };


export default class ExternalAssignmentSyncConcept {
  private externalSourceAccounts: Collection<ExternalSourceAccountDoc>;
  private externalAssignments: Collection<ExternalAssignmentDoc>;

  constructor(private readonly db: Db) {
    this.externalSourceAccounts = this.db.collection(PREFIX + "externalSourceAccounts");
    this.externalAssignments = this.db.collection(PREFIX + "externalAssignments");
  }

  /**
   * connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (sourceAccount: ExternalSourceAccount)
   * connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: InvalidCredentialsError)
   * connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: NetworkError)
   * connectSource (owner: User, sourceType: String, sourceName: String, details: ConnectionDetails): (error: DuplicateSourceError)
   *
   * **purpose** Establishes a new connection to an external platform for a given user using provided credentials and identification.
   * **requires**
   * No `ExternalSourceAccount` already exists for the `owner` with the same `sourceName`.
   * The `details` are valid and allow successful authentication with the external platform API.
   * **effects**
   * A new unique `ExternalSourceAccount` identifier is generated and returned.
   * The new `ExternalSourceAccount` is added to the concept's state, storing its `owner`, `sourceType`, `sourceName`, and `connectionDetails`.
   * `lastSuccessfulPoll` for the new `sourceAccount` is initialized to `null`.
   */
  async connectSource(
    { owner, sourceType, sourceName, details }: ConnectSourceArgs,
  ): Promise<ConnectSourceSuccess | InvalidCredentialsError | NetworkError | DuplicateSourceError> {
    // Check for duplicate sourceName for the owner first
    const existingSource = await this.externalSourceAccounts.findOne({ owner, sourceName });
    if (existingSource) {
      return { error: `A source with name '${sourceName}' already exists for this user.` };
    }

    // Validate credentials with real Canvas API
    if (sourceType === "Canvas") {
      try {
        const isValid = await validateCanvasCredentials(details.baseUrl, details.apiToken);
        if (!isValid) {
          return { error: "Invalid credentials provided." };
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'NETWORK_ERROR') {
          return { error: "Network error connecting to external platform." };
        }
        // Unknown error - treat as network error
        return { error: "Network error connecting to external platform." };
      }
    } else {
      // For non-Canvas sources, use mock validation for now
      if (details.apiToken === "invalid_token") {
        return { error: "Invalid credentials provided." };
      }
    }

    const newSourceAccountId = freshID();
    const newSourceAccount: ExternalSourceAccountDoc = {
      _id: newSourceAccountId,
      owner,
      sourceType,
      sourceName,
      connectionDetails: details,
      // lastSuccessfulPoll is implicitly undefined (null-like) if not explicitly set here
    };

    await this.externalSourceAccounts.insertOne(newSourceAccount);
    return { sourceAccount: newSourceAccountId };
  }

  /**
   * disconnectSource (sourceAccount: ExternalSourceAccount)
   * disconnectSource (sourceAccount: ExternalSourceAccount): (error: SourceNotFound)
   *
   * **purpose** Removes an existing connection to an external platform and all its associated assignment mappings.
   * **requires** `sourceAccount` exists in the concept's state.
   * **effects**
   * The `sourceAccount` and its associated data (`owner`, `sourceType`, `sourceName`, `connectionDetails`, `lastSuccessfulPoll`) are removed from the concept's state.
   * All mappings from `ExternalAssignmentId` to `Assignment` that are associated with the `sourceAccount` are removed.
   */
  async disconnectSource(
    { sourceAccount }: { sourceAccount: ID },
  ): Promise<Empty | SourceNotFound> {
    const existingSource = await this.externalSourceAccounts.findOne({ _id: sourceAccount });
    if (!existingSource) {
      return { error: `Source account '${sourceAccount}' not found.` };
    }

    // Delete the source account
    await this.externalSourceAccounts.deleteOne({ _id: sourceAccount });
    // Delete all associated external assignment mappings
    await this.externalAssignments.deleteMany({ source: sourceAccount });

    return {};
  }

  /**
   * pollExternalSource (sourceAccount: ExternalSourceAccount): (rawExternalAssignments: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp })
   * pollExternalSource (sourceAccount: ExternalSourceAccount): (error: NetworkError)
   * pollExternalSource (sourceAccount: ExternalSourceAccount): (error: ApiRateLimitError)
   * pollExternalSource (sourceAccount: ExternalSourceAccount): (error: SourceConnectionError)
   *
   * **purpose** Calls the external API to retrieve the current list of assignments from a connected platform.
   * **requires**
   * `sourceAccount` exists in the concept's state.
   * `sourceAccount.connectionDetails` are valid and functional for accessing the external platform.
   * **effects**
   * Connects to the external platform using `sourceAccount.connectionDetails`.
   * Retrieves the current list of assignments from the external platform, including their unique identifiers (`externalId`), their full details (`details`), and their latest modification timestamps (`externalModificationTimestamp`).
   * `sourceAccount.lastSuccessfulPoll` is updated to the current time.
   * Returns the raw list of assignments.
   */
  async pollExternalSource(
    { sourceAccount }: { sourceAccount: ID },
  ): Promise<PollExternalSourceSuccess | NetworkError | ApiRateLimitError | SourceConnectionError> {
    const existingSource = await this.externalSourceAccounts.findOne({ _id: sourceAccount });
    if (!existingSource) {
      // While SourceNotFound isn't an explicit overload, this implies a connection issue.
      return { error: `Source connection error: account '${sourceAccount}' not found.` };
    }

    const { connectionDetails, sourceType } = existingSource;
    let rawAssignments: RawExternalAssignment[] = [];

    // Fetch assignments based on source type
    if (sourceType === "Canvas") {
      try {
        const canvasAssignments = await fetchCanvasAssignments(
          connectionDetails.baseUrl,
          connectionDetails.apiToken,
        );

        // Convert Canvas assignments to our internal format
        rawAssignments = canvasAssignments.map((assignment) => ({
          externalId: String(assignment.id),
          details: {
            name: assignment.name,
            description: assignment.description || undefined,
            dueDate: assignment.due_at ? new Date(assignment.due_at).getTime() : undefined,
          },
          externalModificationTimestamp: new Date(assignment.updated_at).getTime(),
        }));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'INVALID_CREDENTIALS') {
            return { error: "Source connection error: API token expired or invalid." };
          } else if (error.message === 'RATE_LIMIT') {
            return { error: "External API rate limit exceeded." };
          } else if (error.message === 'NETWORK_ERROR') {
            return { error: "Network error during external API call." };
          }
        }
        // Unknown error - treat as network error
        return { error: "Network error during external API call." };
      }
    } else {
      // For non-Canvas sources, use mock data for now
      // This can be extended for GitHub, Catsoop, etc.
      rawAssignments = [
        {
          externalId: "mock-assign-1",
          details: { name: "Mock Assignment 1", description: "First assignment", dueDate: 1678886400000 },
          externalModificationTimestamp: 1678800000000,
        },
      ];
    }

    // Update lastSuccessfulPoll on success
    await this.externalSourceAccounts.updateOne(
      { _id: sourceAccount },
      { $set: { lastSuccessfulPoll: Date.now() } },
    );

    return { rawExternalAssignments: rawAssignments };
  }

  /**
   * identifyChanges (sourceAccount: ExternalSourceAccount, rawExternalAssignments: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp }): (assignmentsToProcess: set of { externalId: String, details: ExternalAssignmentDetails, externalModificationTimestamp: Timestamp, existingInternalId: Assignment | null })
   *
   * **purpose** Compares newly fetched external assignments against previously recorded state to identify new or updated items.
   * **requires** `sourceAccount` exists in the concept's state.
   * **effects**
   * For each external assignment in `rawExternalAssignments`:
   * If no ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`, OR if an ExternalAssignment exists but its `externalModificationTimestamp` is older than the one from `rawExternalAssignments`:
   * The assignment details are added to the `assignmentsToProcess` result.
   * `existingInternalId` is set to the `internalAssignment` from the matching ExternalAssignment if it exists, otherwise `null`.
   * Returns the set of assignments identified for processing.
   */
  async identifyChanges(
    { sourceAccount, rawExternalAssignments }: { sourceAccount: ID; rawExternalAssignments: RawExternalAssignment[] },
  ): Promise<IdentifyChangesSuccess> {
    // Requires: sourceAccount exists (precondition, assumed to be met by caller)
    const assignmentsToProcess: AssignmentToProcess[] = [];

    for (const rawExtAssignment of rawExternalAssignments) {
      const existingMapping = await this.externalAssignments.findOne({
        source: sourceAccount,
        externalId: rawExtAssignment.externalId,
      });

      if (!existingMapping) {
        // This is a new external assignment
        assignmentsToProcess.push({
          ...rawExtAssignment,
          existingInternalId: null, // No internal ID mapped yet
        });
      } else if (
        rawExtAssignment.externalModificationTimestamp > existingMapping.lastExternalModificationTimestamp
      ) {
        // This is an existing external assignment that has been modified externally
        assignmentsToProcess.push({
          ...rawExtAssignment,
          existingInternalId: existingMapping.internalAssignment, // Provide the currently mapped internal ID
        });
      }
      // If the assignment exists and its externalModificationTimestamp is NOT newer,
      // it's considered unchanged and is not included in assignmentsToProcess.
    }

    return { assignmentsToProcess };
  }

  /**
   * recordInternalSync (sourceAccount: ExternalSourceAccount, externalId: String, internalId: Assignment, externalModificationTimestamp: Timestamp)
   *
   * **purpose** Records that an external assignment has been successfully processed by the application (either created or updated) and mapped to an internal assignment, along with its latest external modification timestamp.
   * **requires** `sourceAccount` exists in the concept's state.
   * **effects**
   * If an ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`:
   * Updates its `internalAssignment` to `internalId` and `lastExternalModificationTimestamp` to `externalModificationTimestamp`.
   * Otherwise:
   * Creates a new ExternalAssignment with `source = sourceAccount`, `externalId = externalId`, `internalAssignment = internalId`, and `lastExternalModificationTimestamp = externalModificationTimestamp`.
   */
  async recordInternalSync(
    { sourceAccount, externalId, internalId, externalModificationTimestamp }: {
      sourceAccount: ID;
      externalId: string;
      internalId: Assignment;
      externalModificationTimestamp: number;
    },
  ): Promise<Empty> {
    // Requires: sourceAccount exists (precondition, assumed to be met by caller)
    const existingMapping = await this.externalAssignments.findOne({ source: sourceAccount, externalId });

    if (existingMapping) {
      // Update existing mapping
      await this.externalAssignments.updateOne(
        { _id: existingMapping._id },
        {
          $set: {
            internalAssignment: internalId,
            lastExternalModificationTimestamp: externalModificationTimestamp,
          },
        },
      );
    } else {
      // Create new mapping
      const newMappingId = freshID();
      const newMapping: ExternalAssignmentDoc = {
        _id: newMappingId,
        source: sourceAccount,
        externalId,
        internalAssignment: internalId,
        lastExternalModificationTimestamp: externalModificationTimestamp,
      };
      await this.externalAssignments.insertOne(newMapping);
    }

    return {};
  }

  /**
   * _getSourcesForUser (user: User): (sources: array of ExternalSourceAccount)
   *
   * **purpose** Retrieves all external source accounts connected by a specific user.
   * **requires** `user` exists in the system (implicitly, as a generic parameter).
   * **effects** Returns an array of all `ExternalSourceAccount` entities where `owner` is `user`.
   */
  async _getSourcesForUser(
    { user }: { user: User },
  ): Promise<GetSourcesForUserSuccess> {
    const sources = await this.externalSourceAccounts.find({ owner: user }).toArray();
    return { sources }; // Queries must always return an array
  }

  /**
   * _getMappedInternalId (externalId: String, sourceAccount: ExternalSourceAccount): (internalId: Assignment)
   * _getMappedInternalId (externalId: String, sourceAccount: ExternalSourceAccount): (error: String)
   *
   * **purpose** Retrieves the internal assignment ID corresponding to a given external assignment ID and source.
   * **requires** An ExternalAssignment exists with `source = sourceAccount` and `externalId = externalId`.
   * **effects** Returns the `internalAssignment` from the matching ExternalAssignment.
   */
  async _getMappedInternalId(
    { externalId, sourceAccount }: { externalId: string; sourceAccount: ID },
  ): Promise<GetMappedInternalIdSuccess | { error: string }> {
    const mapping = await this.externalAssignments.findOne({ source: sourceAccount, externalId });
    if (!mapping) {
      return { error: `External assignment with ID '${externalId}' not found for source '${sourceAccount}'.` };
    }
    return { internalId: mapping.internalAssignment };
  }

  /**
   * _getAssignmentsForSource (sourceAccount: ExternalSourceAccount): (assignments: array of ExternalAssignment)
   * _getAssignmentsForSource (sourceAccount: ExternalSourceAccount): (error: String)
   *
   * **purpose** Retrieves all external assignments currently synced for a specific external source account.
   * **requires** `sourceAccount` exists in the concept's state.
   * **effects** Returns an array of all ExternalAssignments where `source = sourceAccount`.
   */
  async _getAssignmentsForSource(
    { sourceAccount }: { sourceAccount: ID },
  ): Promise<GetAssignmentsForSourceSuccess | { error: string }> {
    const existingSource = await this.externalSourceAccounts.findOne({ _id: sourceAccount });
    if (!existingSource) {
      return { error: `Source account '${sourceAccount}' not found.` };
    }
    const assignments = await this.externalAssignments.find({ source: sourceAccount }).toArray();
    return { assignments }; // Queries must always return an array
  }
}