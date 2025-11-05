[@concept-specifications](../background/concept-specifications.md)

# Concept API extraction

You are an expert software architect tasked with generating clear, developer-friendly API documentation. Your input is a formal "Concept Specification" which describes a modular piece of software functionality. This concept has been implemented and exposed as a REST-like API by a "Concept Server."

Your mission is to translate the provided Concept Specification into a structured API specification document written in Markdown. This document will be used by frontend developers to interact with the API.

Adhere to the following rules for the API structure and the documentation format:

**API Structure Rules:**

1.  **Base URL:** Assume a base URL of `/api`.
2.  **Endpoint Naming:** Each concept action or query maps to an endpoint. The URL structure is: `/{conceptName}/{actionOrQueryName}`.
    *   For a concept named `Labeling` and an action `createLabel`, the endpoint is `/api/Labeling/createLabel`.
3.  **HTTP Method:** All endpoints use the `POST` method.
4.  **Data Format:** All requests and responses use the `application/json` content type.
5.  **Request Body:** The request body is always a single JSON object. The keys of this object correspond to the input arguments defined in the action's signature.
6.  **Response Body:**
    *   **Actions:** A successful call to an action returns a single JSON object. The keys correspond to the results defined in the action's signature. If there are no results, an empty object `{}` is returned.
    *   **Queries:** A successful call to a query (a method name starting with `_`) returns a JSON **array** of objects.
    *   **Errors:** If an action fails to meet its `requires` condition or encounters another error, it returns a single JSON object with a single key: `{ "error": "A descriptive error message." }`.

**Documentation Format Rules:**

Generate the output in Markdown using the following template. For each action and query in the specification, create a dedicated endpoint section.

~~~markdown
# API Specification: {Concept Name} Concept

**Purpose:** {The concept's purpose.}

---

## API Endpoints

### POST /api/{conceptName}/{actionName}

**Description:** {A brief, one-sentence description of what this action does.}

**Requirements:**
- {List each point from the 'requires' section of the specification.}

**Effects:**
- {List each point from the 'effects' section of the specification.}

**Request Body:**
```json
{
  "argument1": "{type}",
  "argument2": "{type}"
}
```

**Success Response Body (Action):**
```json
{
  "result1": "{type}",
  "result2": "{type}"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result1": "{type}",
    "result2": "{type}"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
*(Repeat for each action and query)*
~~~

# prompt:

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.

# UserAuthentication

**concept** UserAuthentication [User]

**purpose** Enable users to securely identify themselves, establish active sessions, and manage their access credentials for this and other integrated systems.

**principle** If a new user registers with a unique username and password, they can then log in with those credentials to establish an active session, allowing them to perform actions as that authenticated user. When logged in, they can securely store and retrieve credentials for other systems, which remain inaccessible when logged out.

**state**
a set of Users with
  username: String
  hashedPassword: String // Stores the hash of the user's password
  additionalCredentials: Map<String, String> // Maps credential type (e.g., "Canvas") to an encrypted credential value

a set of activeSessions with
  user: User // The authenticated user
  sessionToken: String // A unique identifier for the active session

**actions**
// Assumed: `hash(password)` is a secure one-way hashing function

register (username: String, password: String): (user: User)
  **requires** not (exists User u where u.username = username)
  **effects**
    create new User called newUser
    newUser.username := username
    newUser.hashedPassword := hash(password)
    newUser.additionalCredentials := an empty Map
    return user := newUser

register (username: String, password: String): (error: String)
  **requires** exists User u where u.username = username
  **effects** return error := "Username already taken"

login (username: String, password: String): (sessionToken: String)
  **requires**
    exists User u where u.username = username and u.hashedPassword = hash(password)
  **effects**
    let user_found be the User u where u.username = username
    create new unique sessionToken called newSessionToken
    add {user: user_found, sessionToken: newSessionToken} to activeSessions
    return sessionToken := newSessionToken

login (username: String, password: String): (error: String)
  **requires** not (exists User u where u.username = username and u.hashedPassword = hash(password))
  **effects** return error := "Invalid username or password"

logout (sessionToken: String): (success: Boolean)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken
  **effects**
    remove s from activeSessions where s.sessionToken = sessionToken
    return success := true

logout (sessionToken: String): (error: String)
  **requires** not (exists s in activeSessions where s.sessionToken = sessionToken)
  **effects** return error := "Invalid session token"

getCurrentUser (sessionToken: String): (user: User)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    return user := user_found

getCurrentUser (sessionToken: String): (error: String)
  **requires** not (exists s in activeSessions where s.sessionToken = sessionToken)
  **effects** return error := "Invalid session token"

storeCredential (sessionToken: String, credentialType: String, credentialValue: String): (success: Boolean)
  **requires**
    exists s in activeSessions where s.sessionToken = sessionToken
    credentialType is not an empty string
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    user_found.additionalCredentials[credentialType] := credentialValue // In a real system, credentialValue would be encrypted
    return success := true

storeCredential (sessionToken: String, credentialType: String, credentialValue: String): (error: String)
  **requires** not (exists s in activeSessions where s.sessionToken = sessionToken)
  **effects** return error := "Invalid session token"

storeCredential (sessionToken: String, credentialType: String, credentialValue: String): (error: String)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken AND credentialType is an empty string
  **effects** return error := "Credential type cannot be empty"

retrieveCredential (sessionToken: String, credentialType: String): (credentialValue: String)
  **requires**
    exists s in activeSessions where s.sessionToken = sessionToken and
    let user_found be s.user where s.sessionToken = sessionToken and
    user_found.additionalCredentials contains key credentialType
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    return credentialValue := user_found.additionalCredentials[credentialType]

retrieveCredential (sessionToken: String, credentialType: String): (error: String)
  **requires**
    not (exists s in activeSessions where s.sessionToken = sessionToken) OR
    (exists s in activeSessions where s.sessionToken = sessionToken and
     let user_found be s.user where s.sessionToken = sessionToken and
     not (user_found.additionalCredentials contains key credentialType))
  **effects** return error := "Invalid session token or credential type not found"

updateCredential (sessionToken: String, credentialType: String, newCredentialValue: String): (success: Boolean)
  **requires**
    exists s in activeSessions where s.sessionToken = sessionToken
    credentialType is not an empty string
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    user_found.additionalCredentials[credentialType] := newCredentialValue
    return success := true

updateCredential (sessionToken: String, credentialType: String, newCredentialValue: String): (error: String)
  **requires** not (exists s in activeSessions where s.sessionToken = sessionToken)
  **effects** return error := "Invalid session token"

updateCredential (sessionToken: String, credentialType: String, newCredentialValue: String): (error: String)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken AND credentialType is an empty string
  **effects** return error := "Credential type cannot be empty"

updateCredential (sessionToken: String, credentialType: String, newCredentialValue: String): (error: String)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken AND (let user_found be s.user where s.sessionToken = sessionToken AND not (user_found.additionalCredentials contains key credentialType))
  **effects** return error := "Credential type not found for this user"

deleteCredential (sessionToken: String, credentialType: String): (success: Boolean)
  **requires**
    exists s in activeSessions where s.sessionToken = sessionToken and
    let user_found be s.user where s.sessionToken = sessionToken and
    user_found.additionalCredentials contains key credentialType
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    remove credentialType from user_found.additionalCredentials
    return success := true

deleteCredential (sessionToken: String, credentialType: String): (error: String)
  **requires**
    not (exists s in activeSessions where s.sessionToken = sessionToken) OR
    (exists s in activeSessions where s.sessionToken = sessionToken and
     let user_found be s.user where s.sessionToken = sessionToken and
     not (user_found.additionalCredentials contains key credentialType))
  **effects** return error := "Invalid session token or credential type not found"

getCredentialTypes (sessionToken: String): (types: set of String)
  **requires** exists s in activeSessions where s.sessionToken = sessionToken
  **effects**
    let user_found be s.user where s.sessionToken = sessionToken
    return types := keys of user_found.additionalCredentials

getCredentialTypes (sessionToken: String): (error: String)
  **requires** not (exists s in activeSessions where s.sessionToken = sessionToken)
  **effects** return error := "Invalid session token"

# response:

# API Specification: UserAuthentication Concept

**Purpose:** Enable users to securely identify themselves, establish active sessions, and manage their access credentials for this and other integrated systems.

---

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**
- The provided username must not already exist.

**Effects:**
- A new User is created.
- The new User's username is set to the input username.
- The new User's hashedPassword is set to the hash of the input password.
- The new User's additionalCredentials map is initialized as empty.
- The identifier of the newly created User is returned.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/login

**Description:** Authenticates a user with provided credentials and establishes a new session.

**Requirements:**
- A User must exist with the provided username and their hashed password must match the hash of the provided password.

**Effects:**
- The User matching the username is found.
- A new unique sessionToken is created.
- A new active session linking the found User and the new sessionToken is added to activeSessions.
- The new sessionToken is returned.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**
```json
{
  "sessionToken": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/logout

**Description:** Terminates an active user session by invalidating its token.

**Requirements:**
- An active session must exist with the provided sessionToken.

**Effects:**
- The active session with the matching sessionToken is removed from activeSessions.
- A success boolean is returned.

**Request Body:**
```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Action):**
```json
{
  "success": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/getCurrentUser

**Description:** Retrieves the identifier of the authenticated user for a given active session.

**Requirements:**
- An active session must exist with the provided sessionToken.

**Effects:**
- The user associated with the matching sessionToken is found.
- The identifier of the found user is returned.

**Request Body:**
```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Action):**
```json
{
  "user": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/storeCredential

**Description:** Saves an additional credential for the authenticated user under a specified type.

**Requirements:**
- An active session must exist with the provided sessionToken.
- The credentialType must not be an empty string.

**Effects:**
- The user associated with the matching sessionToken is found.
- The user's additionalCredentials map is updated with the credentialType and credentialValue.
- A success boolean is returned.

**Request Body:**
```json
{
  "sessionToken": "string",
  "credentialType": "string",
  "credentialValue": "string"
}
```

**Success Response Body (Action):**
```json
{
  "success": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/retrieveCredential

**Description:** Fetches a specific additional credential associated with the authenticated user and a given type.

**Requirements:**
- An active session must exist with the provided sessionToken.
- The user associated with the sessionToken must have an additional credential stored under the given credentialType.

**Effects:**
- The user associated with the matching sessionToken is found.
- The credentialValue for the specified credentialType is returned.

**Request Body:**
```json
{
  "sessionToken": "string",
  "credentialType": "string"
}
```

**Success Response Body (Action):**
```json
{
  "credentialValue": "string"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/updateCredential

**Description:** Modifies an existing additional credential for the authenticated user.

**Requirements:**
- An active session must exist with the provided sessionToken.
- The credentialType must not be an empty string.
- The user associated with the sessionToken must already have an additional credential stored under the given credentialType.

**Effects:**
- The user associated with the matching sessionToken is found.
- The user's additionalCredentials map is updated with the newCredentialValue for the specified credentialType.
- A success boolean is returned.

**Request Body:**
```json
{
  "sessionToken": "string",
  "credentialType": "string",
  "newCredentialValue": "string"
}
```

**Success Response Body (Action):**
```json
{
  "success": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/deleteCredential

**Description:** Removes a specific additional credential from the authenticated user's stored credentials.

**Requirements:**
- An active session must exist with the provided sessionToken.
- The user associated with the sessionToken must have an additional credential stored under the given credentialType.

**Effects:**
- The user associated with the matching sessionToken is found.
- The specified credentialType and its value are removed from the user's additionalCredentials.
- A success boolean is returned.

**Request Body:**
```json
{
  "sessionToken": "string",
  "credentialType": "string"
}
```

**Success Response Body (Action):**
```json
{
  "success": "boolean"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/getCredentialTypes

**Description:** Lists all credential types stored for the authenticated user.

**Requirements:**
- An active session must exist with the provided sessionToken.

**Effects:**
- The user associated with the matching sessionToken is found.
- A set of all credential types (keys) from the user's additionalCredentials is returned.

**Request Body:**
```json
{
  "sessionToken": "string"
}
```

**Success Response Body (Action):**
```json
{
  "types": [
    "string"
  ]
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```