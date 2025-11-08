/**
 * TaskMate synchronizations for authentication and request handling
 */

import {
  AIPrioritizedTask,
  Requesting,
  TodoList,
  UserAuthentication,
} from "@concepts";
import { actions, Sync } from "@engine";

/**
 * Authentication Synchronizations
 * These verify session tokens before allowing access to protected routes
 */

// When any authenticated task request comes in, verify the session first
export const AuthenticateTaskRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/getPrioritizedTasks", sessionToken },
    { request },
  ]),
  then: actions([
    UserAuthentication.getCurrentUser,
    { sessionToken },
  ]),
});

// If session is valid, make the actual task query with the authenticated user
export const GetPrioritizedTasksWithAuth: Sync = ({
  request,
  sessionToken,
  user,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/getPrioritizedTasks", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    AIPrioritizedTask.getPrioritizedTasks,
    { owner: user },
  ]),
});

// Respond with the tasks
export const GetPrioritizedTasksResponse: Sync = ({ request, tasks }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/getPrioritizedTasks" },
      { request },
    ],
    [AIPrioritizedTask.getPrioritizedTasks, {}, { tasks }],
  ),
  then: actions([Requesting.respond, { request, tasks }]),
});

// Create Task with Authentication
export const AuthenticateCreateTaskRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/createTask", sessionToken },
    { request },
  ]),
  then: actions([
    UserAuthentication.getCurrentUser,
    { sessionToken },
  ]),
});

export const CreateTaskWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  name,
  description,
  dueDate,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/createTask", sessionToken, name, description, dueDate },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    AIPrioritizedTask.createTask,
    { owner: user, name, description, dueDate },
  ]),
});

export const CreateTaskResponse: Sync = ({ request, task }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/createTask" },
      { request },
    ],
    [AIPrioritizedTask.createTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

// Update Task with Authentication
export const AuthenticateUpdateTaskRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/updateTask", sessionToken },
    { request },
  ]),
  then: actions([
    UserAuthentication.getCurrentUser,
    { sessionToken },
  ]),
});

export const UpdateTaskWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  task,
  newName,
  newDescription,
  newDueDate,
  newEffort,
  newImportance,
  newDifficulty,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/AIPrioritizedTask/updateTask",
        sessionToken,
        task,
        newName,
        newDescription,
        newDueDate,
        newEffort,
        newImportance,
        newDifficulty,
      },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    AIPrioritizedTask.updateTask,
    {
      task,
      newName,
      newDescription,
      newDueDate,
      newEffort,
      newImportance,
      newDifficulty,
    },
  ]),
});

export const UpdateTaskResponse: Sync = ({ request, task }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/updateTask" },
      { request },
    ],
    [AIPrioritizedTask.updateTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

/**
 * TodoList Synchronizations with Authentication
 */

// Get Lists with Authentication
export const AuthenticateGetListsRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/getListsForUser", sessionToken },
    { request },
  ]),
  then: actions([
    UserAuthentication.getCurrentUser,
    { sessionToken },
  ]),
});

export const GetListsWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/getListsForUser", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    TodoList.getListsForUser,
    { user },
  ]),
});

export const GetListsResponse: Sync = ({ request, lists }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/getListsForUser" },
      { request },
    ],
    [TodoList.getListsForUser, {}, { lists }],
  ),
  then: actions([Requesting.respond, { request, lists }]),
});

// Create List with Authentication
export const AuthenticateCreateListRequest: Sync = ({
  request,
  sessionToken,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/createList", sessionToken },
    { request },
  ]),
  then: actions([
    UserAuthentication.getCurrentUser,
    { sessionToken },
  ]),
});

export const CreateListWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  name,
  description,
  startTime,
  endTime,
  recurrenceType,
  autoClearCompleted,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/TodoList/createList",
        sessionToken,
        name,
        description,
        startTime,
        endTime,
        recurrenceType,
        autoClearCompleted,
      },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    TodoList.createList,
    {
      owner: user,
      name,
      description,
      startTime,
      endTime,
      recurrenceType,
      autoClearCompleted,
    },
  ]),
});

export const CreateListResponse: Sync = ({ request, list }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/createList" },
      { request },
    ],
    [TodoList.createList, {}, { list }],
  ),
  then: actions([Requesting.respond, { request, list }]),
});
