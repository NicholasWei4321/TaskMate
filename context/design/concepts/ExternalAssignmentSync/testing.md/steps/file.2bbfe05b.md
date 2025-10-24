---
timestamp: 'Thu Oct 23 2025 21:31:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251023_213101.fb204c6c.md]]'
content_id: 2bbfe05be2aa3d0a15590701b9b2bab047e923421b9b542e9f582a7f3740f626
---

# file: src/concepts/canvas-api.ts

```typescript
// src/concepts/canvas-api.ts

// Mock Canvas API types for consistency, based on typical Canvas assignment structure
interface CanvasAssignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null; // ISO string format for dates
  updated_at: string; // ISO string format for dates
}

// Mock function to simulate Canvas credential validation API call
export async function validateCanvasCredentials(baseUrl: string, apiToken: string): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate various error conditions for testing purposes
  if (apiToken === "invalid_token_network_error") {
    // A specific token to trigger a simulated network error during validation
    throw new Error('NETWORK_ERROR');
  }
  if (apiToken === "valid_canvas_token") {
    // This token always passes validation
    return true;
  }
  // Any other token is considered invalid for validation
  return false;
}

// Mock function to simulate fetching assignments from Canvas API
export async function fetchCanvasAssignments(baseUrl: string, apiToken: string): Promise<CanvasAssignment[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 10));

  // Simulate various error conditions for testing purposes during polling
  if (apiToken === "invalid_token_after_connect") {
    // This token simulates credentials becoming invalid after initial connection
    throw new Error('INVALID_CREDENTIALS');
  }
  if (apiToken === "rate_limit_token") {
    // This token simulates hitting an API rate limit
    throw new Error('RATE_LIMIT');
  }
  if (apiToken === "network_failure_token") {
    // This token simulates a general network error during data fetching
    throw new Error('NETWORK_ERROR');
  }

  // Returns the globally set mock assignments.
  // This allows tests to control the data returned by the mock API.
  return globalThis.__mockCanvasAssignments || [];
}

// Global variable to hold mock Canvas assignments for `fetchCanvasAssignments`.
// This is used by tests to inject specific assignment data.
globalThis.__mockCanvasAssignments = [];

// Helper function for tests to easily set the mock assignments.
export function setMockCanvasAssignments(assignments: CanvasAssignment[]) {
  globalThis.__mockCanvasAssignments = assignments;
}
```
