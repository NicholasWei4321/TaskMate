// src/concepts/ExternalAssignmentSync/canvas-api.ts

/**
 * Canvas API Integration Utility
 *
 * Provides functions to interact with the Canvas LMS API
 * Documentation: https://canvas.instructure.com/doc/api/
 */

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string | null;
  due_at: string | null; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  points_possible: number | null;
  course_id: number;
  html_url: string; // Direct link to the assignment
  submission_types: string[]; // Types of submissions allowed (e.g., ["online_upload"], ["none"])
  published: boolean; // Whether the assignment is published
  has_submitted_submissions?: boolean; // Whether the user has submitted this assignment
}

export interface CanvasCourse {
  id: number;
  name: string;
}

/**
 * Fetches active/current courses for the authenticated user from Canvas
 * Only returns courses where the user is currently enrolled
 */
export async function fetchCanvasCourses(
  baseUrl: string,
  apiToken: string,
): Promise<CanvasCourse[]> {
  // Filter for active enrollments only
  // enrollment_state=active means currently enrolled courses
  const url = `${baseUrl}/api/v1/courses?enrollment_state=active&per_page=100`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('INVALID_CREDENTIALS');
    } else if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    } else if (response.status >= 500) {
      throw new Error('NETWORK_ERROR');
    }
    throw new Error(`Canvas API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Fetches recent assignments from active courses for the authenticated user
 * Filters to only include assignments from the last 6 months or with future due dates
 */
export async function fetchCanvasAssignments(
  baseUrl: string,
  apiToken: string,
): Promise<CanvasAssignment[]> {
  try {
    // First, get only active courses
    const courses = await fetchCanvasCourses(baseUrl, apiToken);

    // Then fetch assignments for each course
    const allAssignments: CanvasAssignment[] = [];

    const now = new Date();

    for (const course of courses) {
      // Canvas API endpoint for course assignments
      // Include submissions to check if user has submitted
      const url = `${baseUrl}/api/v1/courses/${course.id}/assignments?include[]=submission&per_page=100`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        } else if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        } else if (response.status >= 500) {
          throw new Error('NETWORK_ERROR');
        }
        // Skip this course if there's an error but continue with others
        console.warn(`Failed to fetch assignments for course ${course.id}: ${response.status}`);
        continue;
      }

      const assignments: any[] = await response.json();

      // Filter to only include relevant unfinished assignments
      const unfinishedAssignments = assignments.filter(assignment => {
        // Only include published assignments
        if (!assignment.published) return false;

        // Exclude assignments with no submission type or "none" or "on_paper" or "external_tool"
        // These are typically: attendance, readings, non-graded activities, or external links
        const submissionTypes = assignment.submission_types || [];
        const hasOnlineSubmission = submissionTypes.some(type =>
          type === 'online_upload' ||
          type === 'online_text_entry' ||
          type === 'online_url' ||
          type === 'online_quiz' ||
          type === 'media_recording'
        );

        // Skip assignments that don't have online submission types
        if (!hasOnlineSubmission) return false;

        // Check if assignment has a due date
        if (!assignment.due_at) return false;

        const dueDate = new Date(assignment.due_at);

        // Check submission status
        // Canvas includes a 'submission' object with the assignment when we use include[]=submission
        const submission = assignment.submission;

        // Exclude assignments that have been submitted (workflow_state is anything other than 'unsubmitted')
        // This matches Canvas's "Past" category - assignments where you've made a submission
        // workflow_state can be: 'unsubmitted', 'submitted', 'graded', 'pending_review'
        if (submission && submission.workflow_state !== 'unsubmitted') {
          return false; // Already submitted, goes to "Past" in Canvas
        }

        // At this point, assignment is unsubmitted
        // Include both:
        // 1. Upcoming (due in the future) - matches Canvas "Upcoming Assignments"
        // 2. Overdue (past due date) - matches Canvas "Overdue Assignments"
        return true;
      }).map(assignment => ({
        id: assignment.id,
        name: assignment.name,
        description: assignment.html_url, // Use the assignment URL as the description
        due_at: assignment.due_at,
        updated_at: assignment.updated_at,
        points_possible: assignment.points_possible,
        course_id: assignment.course_id,
        html_url: assignment.html_url,
        submission_types: assignment.submission_types || [],
        published: assignment.published || false,
        has_submitted_submissions: assignment.submission?.workflow_state === 'submitted' ||
                                     assignment.submission?.workflow_state === 'graded'
      }));

      allAssignments.push(...unfinishedAssignments);
    }

    return allAssignments;
  } catch (error) {
    // Re-throw known error types
    if (error instanceof Error &&
        (error.message === 'INVALID_CREDENTIALS' ||
         error.message === 'RATE_LIMIT' ||
         error.message === 'NETWORK_ERROR')) {
      throw error;
    }

    // Network/connection errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('NETWORK_ERROR');
    }

    throw error;
  }
}

/**
 * Validates Canvas API credentials by attempting to fetch user info
 * Used during connectSource to verify credentials before storing them
 */
export async function validateCanvasCredentials(
  baseUrl: string,
  apiToken: string,
): Promise<boolean> {
  try {
    const url = `${baseUrl}/api/v1/users/self`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      // Consume response body to prevent resource leak
      await response.text();
      return false; // Invalid credentials
    }

    if (!response.ok && response.status >= 500) {
      await response.text();
      throw new Error('NETWORK_ERROR');
    }

    // Consume response body to prevent resource leak
    await response.json();
    return response.ok;
  } catch (error) {
    // Network errors should be thrown, not returned as false
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('NETWORK_ERROR');
    }
    if (error instanceof Error && error.message === 'NETWORK_ERROR') {
      throw error;
    }
    return false;
  }
}
