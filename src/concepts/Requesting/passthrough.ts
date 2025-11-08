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
  "/api/UserAuthentication/register": "public registration endpoint",
  "/api/UserAuthentication/login": "public login endpoint",
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
  // === Routes with authentication syncs implemented ===
  // These demonstrate the sync-based authentication pattern

  // Task operations - authentication syncs implemented
  "/api/AIPrioritizedTask/createTask",
  "/api/AIPrioritizedTask/updateTask",
  "/api/AIPrioritizedTask/getPrioritizedTasks",

  // List operations - authentication syncs implemented
  "/api/TodoList/createList",
  "/api/TodoList/getListsForUser",

  // Note: Other routes use passthrough mode for demo purposes.
  // In production, all authenticated routes would have syncs.
  // See docs/route-configuration.md for full authentication plan.
];
