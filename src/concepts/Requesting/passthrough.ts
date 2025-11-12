/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Public authentication routes - anyone can access
  // anyone should be able to register and account, it's impossible to first authenticate and then register
  "/api/UserAuthentication/register": "public registration endpoint: anyone should be able to create an account",
  // anyone should be able to login, since they need to obtain a session token
  "/api/UserAuthentication/login": "public login endpoint: anyone should be able to login to obtain a session token",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // === UserAuthentication - All require session token ===
  "/api/UserAuthentication/logout",
  "/api/UserAuthentication/getCurrentUser",
  "/api/UserAuthentication/storeCredential",
  "/api/UserAuthentication/retrieveCredential",
  "/api/UserAuthentication/updateCredential",
  "/api/UserAuthentication/deleteCredential",
  "/api/UserAuthentication/getCredentialTypes",

  // === AIPrioritizedTask - All require authentication ===
  "/api/AIPrioritizedTask/createTask",
  "/api/AIPrioritizedTask/updateTask",
  "/api/AIPrioritizedTask/snoozeTask",
  "/api/AIPrioritizedTask/completeTask",
  "/api/AIPrioritizedTask/getTask",
  "/api/AIPrioritizedTask/getTasksByOwner",
  "/api/AIPrioritizedTask/getPrioritizedTasks",
  "/api/AIPrioritizedTask/markOverdue",
  "/api/AIPrioritizedTask/calculateTaskPriority",

  // === TodoList - All require authentication ===
  "/api/TodoList/createList",
  "/api/TodoList/addListItem",
  "/api/TodoList/removeListItem",
  "/api/TodoList/deleteList",
  "/api/TodoList/markItemCompleted",
  "/api/TodoList/clearCompletedItems",
  "/api/TodoList/updateList",
  "/api/TodoList/updateListSettings",
  "/api/TodoList/getListsForUser",
  "/api/TodoList/getListByName",
  "/api/TodoList/getActiveListsForUser",
  "/api/TodoList/processRecurringLists",
  "/api/TodoList/autoClearIfNeeded",
  "/api/TodoList/recreateRecurringList",
  "/api/TodoList/hasDefaultDates",

  // === ExternalAssignmentSync - All require authentication ===
  "/api/ExternalAssignmentSync/connectSource",
  "/api/ExternalAssignmentSync/disconnectSource",
  "/api/ExternalAssignmentSync/pollExternalSource",
  "/api/ExternalAssignmentSync/identifyChanges",
  "/api/ExternalAssignmentSync/recordInternalSync",
  "/api/ExternalAssignmentSync/getSourcesForUser",
  "/api/ExternalAssignmentSync/getMappedInternalId",
  "/api/ExternalAssignmentSync/getAssignmentsForSource",

  // === Backend-only private methods (never called by frontend) ===
  "/api/AIPrioritizedTask/_triggerLLMInference",
  "/api/AIPrioritizedTask/_createAttributePrompt",
  "/api/AIPrioritizedTask/_validateInferredAttributes",
  "/api/AIPrioritizedTask/_calculateTimeBasedPriority",
  "/api/AIPrioritizedTask/_calculateAIPriority",
  "/api/AIPrioritizedTask/_recalculateAndSavePriority",
];
