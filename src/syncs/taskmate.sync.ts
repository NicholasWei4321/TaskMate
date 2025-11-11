/**
 * TaskMate synchronizations for authentication and request handling
 * All excluded routes require session token verification
 */

import {
  AIPrioritizedTask,
  ExternalAssignmentSync,
  Requesting,
  TodoList,
  UserAuthentication,
} from "@concepts";
import { actions, Sync } from "@engine";

/**
 * PATTERN: Each protected route has 2-3 syncs:
 * 1. Authenticate: Verify sessionToken → getCurrentUser
 * 2. Execute: Use authenticated user → execute action
 * 3. Respond: Send result back to frontend
 */

// ============================================================================
// UserAuthentication Syncs
// ============================================================================

// Logout
export const AuthenticateLogoutRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/logout", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const LogoutWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/logout", sessionToken }, { request }],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([UserAuthentication.logout, { sessionToken }]),
});

export const LogoutResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/logout" }, { request }],
    [UserAuthentication.logout, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const LogoutErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/logout" }, { request }],
    [UserAuthentication.logout, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Store Credential
export const AuthenticateStoreCredentialRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/storeCredential", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const StoreCredentialWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  credentialType,
  credentialValue,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/storeCredential", sessionToken, credentialType, credentialValue },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    UserAuthentication.storeCredential,
    { sessionToken, credentialType, credentialValue },
  ]),
});

export const StoreCredentialResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/storeCredential" }, { request }],
    [UserAuthentication.storeCredential, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const StoreCredentialErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/storeCredential" }, { request }],
    [UserAuthentication.storeCredential, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Retrieve Credential
export const AuthenticateRetrieveCredentialRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/retrieveCredential", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const RetrieveCredentialWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  credentialType,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/retrieveCredential", sessionToken, credentialType },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    UserAuthentication.retrieveCredential,
    { sessionToken, credentialType },
  ]),
});

export const RetrieveCredentialResponse: Sync = ({ request, credentialValue }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/retrieveCredential" }, { request }],
    [UserAuthentication.retrieveCredential, {}, { credentialValue }],
  ),
  then: actions([Requesting.respond, { request, credentialValue }]),
});

export const RetrieveCredentialErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/retrieveCredential" }, { request }],
    [UserAuthentication.retrieveCredential, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get Credential Types
export const AuthenticateGetCredentialTypesRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/getCredentialTypes", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetCredentialTypesWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/getCredentialTypes", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([UserAuthentication.getCredentialTypes, { sessionToken }]),
});

export const GetCredentialTypesResponse: Sync = ({ request, credentialTypes }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/getCredentialTypes" }, { request }],
    [UserAuthentication.getCredentialTypes, {}, { credentialTypes }],
  ),
  then: actions([Requesting.respond, { request, credentialTypes }]),
});

export const GetCredentialTypesErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/getCredentialTypes" }, { request }],
    [UserAuthentication.getCredentialTypes, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get Current User
export const AuthenticateGetCurrentUserRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/getCurrentUser", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetCurrentUserResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/getCurrentUser" }, { request }],
    [UserAuthentication.getCurrentUser, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

export const GetCurrentUserErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/getCurrentUser" }, { request }],
    [UserAuthentication.getCurrentUser, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Update Credential
export const AuthenticateUpdateCredentialRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/updateCredential", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const UpdateCredentialWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  credentialType,
  credentialValue,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/updateCredential", sessionToken, credentialType, credentialValue },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    UserAuthentication.updateCredential,
    { sessionToken, credentialType, credentialValue },
  ]),
});

export const UpdateCredentialResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/updateCredential" }, { request }],
    [UserAuthentication.updateCredential, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const UpdateCredentialErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/updateCredential" }, { request }],
    [UserAuthentication.updateCredential, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Delete Credential
export const AuthenticateDeleteCredentialRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/deleteCredential", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const DeleteCredentialWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  credentialType,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/deleteCredential", sessionToken, credentialType },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    UserAuthentication.deleteCredential,
    { sessionToken, credentialType },
  ]),
});

export const DeleteCredentialResponse: Sync = ({ request, success }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/deleteCredential" }, { request }],
    [UserAuthentication.deleteCredential, {}, { success }],
  ),
  then: actions([Requesting.respond, { request, success }]),
});

export const DeleteCredentialErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/deleteCredential" }, { request }],
    [UserAuthentication.deleteCredential, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ============================================================================
// AIPrioritizedTask Syncs
// ============================================================================

// Get Prioritized Tasks
export const AuthenticateGetPrioritizedTasksRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/getPrioritizedTasks", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetPrioritizedTasksWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/getPrioritizedTasks", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.getPrioritizedTasks, { owner: user }]),
});

export const GetPrioritizedTasksResponse: Sync = ({ request, tasks }) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/getPrioritizedTasks" }, { request }],
    [AIPrioritizedTask.getPrioritizedTasks, {}, { tasks }],
  ),
  then: actions([Requesting.respond, { request, tasks }]),
});

// Create Task
export const AuthenticateCreateTaskRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/createTask", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
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
    [Requesting.request, { path: "/AIPrioritizedTask/createTask" }, { request }],
    [AIPrioritizedTask.createTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const CreateTaskErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/createTask" }, { request }],
    [AIPrioritizedTask.createTask, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Update Task
export const AuthenticateUpdateTaskRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/updateTask", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
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
    { task, newName, newDescription, newDueDate, newEffort, newImportance, newDifficulty },
  ]),
});

export const UpdateTaskResponse: Sync = ({ request, task }) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/updateTask" }, { request }],
    [AIPrioritizedTask.updateTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const UpdateTaskErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/updateTask" }, { request }],
    [AIPrioritizedTask.updateTask, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Snooze Task
export const AuthenticateSnoozeTaskRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/snoozeTask", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const SnoozeTaskWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  task,
  newDueDate,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/snoozeTask", sessionToken, task, newDueDate },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.snoozeTask, { task, newDueDate }]),
});

export const SnoozeTaskResponse: Sync = ({ request, task }) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/snoozeTask" }, { request }],
    [AIPrioritizedTask.snoozeTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const SnoozeTaskErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/snoozeTask" }, { request }],
    [AIPrioritizedTask.snoozeTask, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Complete Task
export const AuthenticateCompleteTaskRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/completeTask", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const CompleteTaskWithAuth: Sync = ({ request, sessionToken, user, task }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/completeTask", sessionToken, task },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.completeTask, { task }]),
});

export const CompleteTaskResponse: Sync = ({ request, task }) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/completeTask" }, { request }],
    [AIPrioritizedTask.completeTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const CompleteTaskErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/completeTask" }, { request }],
    [AIPrioritizedTask.completeTask, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get Task By Owner
export const AuthenticateGetTasksByOwnerRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/getTasksByOwner", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetTasksByOwnerWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/getTasksByOwner", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.getTasksByOwner, { owner: user }]),
});

export const GetTasksByOwnerResponse: Sync = ({ request, tasks }) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/getTasksByOwner" }, { request }],
    [AIPrioritizedTask.getTasksByOwner, {}, { tasks }],
  ),
  then: actions([Requesting.respond, { request, tasks }]),
});

// Get Task
export const AuthenticateGetTaskRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/getTask", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetTaskWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  task,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/getTask", sessionToken, task },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.getTask, { task }]),
});

export const GetTaskResponse: Sync = ({ request, task }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/getTask" }, { request }],
    [AIPrioritizedTask.getTask, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const GetTaskErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/getTask" }, { request }],
    [AIPrioritizedTask.getTask, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Mark Overdue
export const AuthenticateMarkOverdueRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/markOverdue", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const MarkOverdueWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  task,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/markOverdue", sessionToken, task },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.markOverdue, { task }]),
});

export const MarkOverdueResponse: Sync = ({ request, task }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/markOverdue" }, { request }],
    [AIPrioritizedTask.markOverdue, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const MarkOverdueErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/markOverdue" }, { request }],
    [AIPrioritizedTask.markOverdue, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Calculate Task Priority
export const AuthenticateCalculateTaskPriorityRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/AIPrioritizedTask/calculateTaskPriority", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const CalculateTaskPriorityWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  task,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/AIPrioritizedTask/calculateTaskPriority", sessionToken, task },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([AIPrioritizedTask.calculateTaskPriority, { task }]),
});

export const CalculateTaskPriorityResponse: Sync = ({ request, task }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/calculateTaskPriority" }, { request }],
    [AIPrioritizedTask.calculateTaskPriority, {}, { task }],
  ),
  then: actions([Requesting.respond, { request, task }]),
});

export const CalculateTaskPriorityErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/AIPrioritizedTask/calculateTaskPriority" }, { request }],
    [AIPrioritizedTask.calculateTaskPriority, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ============================================================================
// TodoList Syncs
// ============================================================================

// Get Lists For User
export const AuthenticateGetListsForUserRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/getListsForUser", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetListsForUserWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/getListsForUser", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.getListsForUser, { user }]),
});

export const GetListsForUserResponse: Sync = ({ request, lists }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/getListsForUser" }, { request }],
    [TodoList.getListsForUser, {}, { lists }],
  ),
  then: actions([Requesting.respond, { request, lists }]),
});

// Create List
export const AuthenticateCreateListRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/createList", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

// CreateList with times provided
export const CreateListWithAuthAndTimes: Sync = ({
  request,
  sessionToken,
  user,
  name,
  recurrenceType,
  autoClearCompleted,
  startTime,
  endTime,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/TodoList/createList",
        sessionToken,
        name,
        recurrenceType,
        autoClearCompleted,
        startTime,
        endTime,
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
      startTime,
      endTime,
      recurrenceType,
      autoClearCompleted,
    },
  ]),
});

// CreateList without times (recurrenceType: 'none'), this is needed because
// we can't pass undefined values to be bound in the when clause so there
// needs to be a separate sync for with/without end times
export const CreateListWithAuthNoTimes: Sync = ({
  request,
  sessionToken,
  user,
  name,
  recurrenceType,
  autoClearCompleted,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/TodoList/createList",
        sessionToken,
        name,
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
      recurrenceType,
      autoClearCompleted,
    },
  ]),
});

export const CreateListResponse: Sync = ({ request, list }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/createList" }, { request }],
    [TodoList.createList, {}, { list }],
  ),
  then: actions([Requesting.respond, { request, list }]),
});

export const CreateListErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/createList" }, { request }],
    [TodoList.createList, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Add List Item
export const AuthenticateAddListItemRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/addListItem", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const AddListItemWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
  item,
  itemDueDate,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/addListItem", sessionToken, list, item, itemDueDate },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.addListItem, { list, item, itemDueDate }]),
});

export const AddListItemResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/addListItem" }, { request }],
    [TodoList.addListItem, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const AddListItemErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/addListItem" }, { request }],
    [TodoList.addListItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Remove List Item
export const AuthenticateRemoveListItemRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/removeListItem", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const RemoveListItemWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
  item,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/removeListItem", sessionToken, list, item },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.removeListItem, { list, item }]),
});

export const RemoveListItemResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/removeListItem" }, { request }],
    [TodoList.removeListItem, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const RemoveListItemErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/removeListItem" }, { request }],
    [TodoList.removeListItem, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Delete List
export const AuthenticateDeleteListRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/deleteList", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const DeleteListWithAuth: Sync = ({ request, sessionToken, user, list }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/deleteList", sessionToken, list },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.deleteList, { list }]),
});

export const DeleteListResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/deleteList" }, { request }],
    [TodoList.deleteList, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DeleteListErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/deleteList" }, { request }],
    [TodoList.deleteList, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Mark Item Completed
export const AuthenticateMarkItemCompletedRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/markItemCompleted", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const MarkItemCompletedWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
  task,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/markItemCompleted", sessionToken, list, task },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.markItemCompleted, { list, task }]),
});

export const MarkItemCompletedResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/markItemCompleted" }, { request }],
    [TodoList.markItemCompleted, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const MarkItemCompletedErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/markItemCompleted" }, { request }],
    [TodoList.markItemCompleted, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Clear Completed Items
export const AuthenticateClearCompletedItemsRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/clearCompletedItems", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const ClearCompletedItemsWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/clearCompletedItems", sessionToken, list },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.clearCompletedItems, { list }]),
});

export const ClearCompletedItemsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/clearCompletedItems" }, { request }],
    [TodoList.clearCompletedItems, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const ClearCompletedItemsErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/clearCompletedItems" }, { request }],
    [TodoList.clearCompletedItems, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Update List
export const AuthenticateUpdateListRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/updateList", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const UpdateListWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
  newName,
  newStartTime,
  newEndTime,
  newAutoClearCompleted,
  newRecurrenceType,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/updateList", sessionToken, list, newName, newStartTime, newEndTime, newAutoClearCompleted, newRecurrenceType },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.updateList, { list, newName, newStartTime, newEndTime, newAutoClearCompleted, newRecurrenceType }]),
});

export const UpdateListResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/updateList" }, { request }],
    [TodoList.updateList, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const UpdateListErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/updateList" }, { request }],
    [TodoList.updateList, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Update List Settings
export const AuthenticateUpdateListSettingsRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/updateListSettings", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const UpdateListSettingsWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  list,
  newStartTime,
  newEndTime,
  newRecurrenceType,
  newAutoClearCompleted,
}) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/TodoList/updateListSettings",
        sessionToken,
        list,
        newStartTime,
        newEndTime,
        newRecurrenceType,
        newAutoClearCompleted,
      },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    TodoList.updateListSettings,
    { list, newStartTime, newEndTime, newRecurrenceType, newAutoClearCompleted },
  ]),
});

export const UpdateListSettingsResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/updateListSettings" }, { request }],
    [TodoList.updateListSettings, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const UpdateListSettingsErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/updateListSettings" }, { request }],
    [TodoList.updateListSettings, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get Active Lists For User
export const AuthenticateGetActiveListsForUserRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/getActiveListsForUser", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetActiveListsForUserWithAuth: Sync = ({ request, sessionToken, user }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/getActiveListsForUser", sessionToken },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.getActiveListsForUser, { user }]),
});

export const GetActiveListsForUserResponse: Sync = ({ request, lists }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/getActiveListsForUser" }, { request }],
    [TodoList.getActiveListsForUser, {}, { lists }],
  ),
  then: actions([Requesting.respond, { request, lists }]),
});

// Get List By Name
export const AuthenticateGetListByNameRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/TodoList/getListByName", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetListByNameWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  name,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/TodoList/getListByName", sessionToken, name },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([TodoList.getListByName, { user, name }]),
});

export const GetListByNameResponse: Sync = ({ request, list }) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/getListByName" }, { request }],
    [TodoList.getListByName, {}, { list }],
  ),
  then: actions([Requesting.respond, { request, list }]),
});

export const GetListByNameErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/TodoList/getListByName" }, { request }],
    [TodoList.getListByName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// ============================================================================
// ExternalAssignmentSync Syncs
// ============================================================================

// Poll External Source
export const AuthenticatePollExternalSourceRequest: Sync = ({ request, sessionToken }) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/pollExternalSource", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const PollExternalSourceWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceAccount,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/pollExternalSource", sessionToken, sourceAccount },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.pollExternalSource, { sourceAccount }]),
});

export const PollExternalSourceResponse: Sync = ({ request, rawExternalAssignments }) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/pollExternalSource" }, { request }],
    [ExternalAssignmentSync.pollExternalSource, {}, { rawExternalAssignments }],
  ),
  then: actions([Requesting.respond, { request, rawExternalAssignments }]),
});

// Connect Source
export const AuthenticateConnectSourceRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/connectSource", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const ConnectSourceWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceType,
  sourceName,
  details,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/connectSource", sessionToken, sourceType, sourceName, details },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.connectSource, { owner: user, sourceType, sourceName, details }]),
});

export const ConnectSourceResponse: Sync = ({ request, sourceAccount }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/connectSource" }, { request }],
    [ExternalAssignmentSync.connectSource, {}, { sourceAccount }],
  ),
  then: actions([Requesting.respond, { request, sourceAccount }]),
});

export const ConnectSourceErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/connectSource" }, { request }],
    [ExternalAssignmentSync.connectSource, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Disconnect Source
export const AuthenticateDisconnectSourceRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/disconnectSource", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const DisconnectSourceWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceAccount,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/disconnectSource", sessionToken, sourceAccount },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.disconnectSource, { sourceAccount }]),
});

export const DisconnectSourceResponse: Sync = ({ request }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/disconnectSource" }, { request }],
    [ExternalAssignmentSync.disconnectSource, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const DisconnectSourceErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/disconnectSource" }, { request }],
    [ExternalAssignmentSync.disconnectSource, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Identify Changes
export const AuthenticateIdentifyChangesRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/identifyChanges", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const IdentifyChangesWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceAccount,
  rawExternalAssignments,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/ExternalAssignmentSync/identifyChanges",
        sessionToken,
        sourceAccount,
        rawExternalAssignments,
      },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    ExternalAssignmentSync.identifyChanges,
    { sourceAccount, rawExternalAssignments },
  ]),
});

export const IdentifyChangesResponse: Sync = ({ request, assignmentsToProcess }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/identifyChanges" }, { request }],
    [ExternalAssignmentSync.identifyChanges, {}, { assignmentsToProcess }],
  ),
  then: actions([Requesting.respond, { request, assignmentsToProcess }]),
});

// Record Internal Sync
export const AuthenticateRecordInternalSyncRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/recordInternalSync", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const RecordInternalSyncWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceAccount,
  externalId,
  internalId,
  externalModificationTimestamp,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      {
        path: "/ExternalAssignmentSync/recordInternalSync",
        sessionToken,
        sourceAccount,
        externalId,
        internalId,
        externalModificationTimestamp,
      },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([
    ExternalAssignmentSync.recordInternalSync,
    { sourceAccount, externalId, internalId, externalModificationTimestamp },
  ]),
});

export const RecordInternalSyncResponse: Sync = ({ request }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/recordInternalSync" }, { request }],
    [ExternalAssignmentSync.recordInternalSync, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

// Get Sources For User
export const AuthenticateGetSourcesForUserRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/getSourcesForUser", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetSourcesForUserWithAuth: Sync = ({
  request,
  sessionToken,
  user,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/getSourcesForUser", sessionToken, user },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.getSourcesForUser, { user }]),
});

export const GetSourcesForUserResponse: Sync = ({ request, sources }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/getSourcesForUser" }, { request }],
    [ExternalAssignmentSync.getSourcesForUser, {}, { sources }],
  ),
  then: actions([Requesting.respond, { request, sources }]),
});

// Get Mapped Internal ID
export const AuthenticateGetMappedInternalIdRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/getMappedInternalId", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetMappedInternalIdWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  externalId,
  sourceAccount,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/getMappedInternalId", sessionToken, externalId, sourceAccount },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.getMappedInternalId, { externalId, sourceAccount }]),
});

export const GetMappedInternalIdResponse: Sync = ({ request, internalId }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/getMappedInternalId" }, { request }],
    [ExternalAssignmentSync.getMappedInternalId, {}, { internalId }],
  ),
  then: actions([Requesting.respond, { request, internalId }]),
});

export const GetMappedInternalIdErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/getMappedInternalId" }, { request }],
    [ExternalAssignmentSync.getMappedInternalId, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// Get Assignments For Source
export const AuthenticateGetAssignmentsForSourceRequest: Sync = ({ request, sessionToken }: any) => ({
  when: actions([
    Requesting.request,
    { path: "/ExternalAssignmentSync/getAssignmentsForSource", sessionToken },
    { request },
  ]),
  then: actions([UserAuthentication.getCurrentUser, { sessionToken }]),
});

export const GetAssignmentsForSourceWithAuth: Sync = ({
  request,
  sessionToken,
  user,
  sourceAccount,
}: any) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/ExternalAssignmentSync/getAssignmentsForSource", sessionToken, sourceAccount },
      { request },
    ],
    [UserAuthentication.getCurrentUser, { sessionToken }, { user }],
  ),
  then: actions([ExternalAssignmentSync.getAssignmentsForSource, { sourceAccount }]),
});

export const GetAssignmentsForSourceResponse: Sync = ({ request, assignments }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/getAssignmentsForSource" }, { request }],
    [ExternalAssignmentSync.getAssignmentsForSource, {}, { assignments }],
  ),
  then: actions([Requesting.respond, { request, assignments }]),
});

export const GetAssignmentsForSourceErrorResponse: Sync = ({ request, error }: any) => ({
  when: actions(
    [Requesting.request, { path: "/ExternalAssignmentSync/getAssignmentsForSource" }, { request }],
    [ExternalAssignmentSync.getAssignmentsForSource, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * Note: System-only actions (processRecurringLists, autoClearIfNeeded, recreateRecurringList, hasDefaultDates)
 * and private methods (_triggerLLMInference, etc.) are excluded from passthrough but don't need syncs
 * because they're never called by frontend. They're only executed by backend code internally.
 */
