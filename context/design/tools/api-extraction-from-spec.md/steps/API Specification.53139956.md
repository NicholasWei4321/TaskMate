---
timestamp: 'Mon Nov 03 2025 15:35:14 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251103_153514.17fbd0ae.md]]'
content_id: 53139956d293631cac1b2ad5cc6ad131bdde7d1ae2046f0b568d33194cd884fb
---

# API Specification: UserAuthentication Concept

**Purpose:** Enable users to securely identify themselves, establish active sessions, and manage their access credentials for this and other integrated systems.

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

* The provided username must not already exist.

**Effects:**

* A new User is created.
* The new User's username is set to the input username.
* The new User's hashedPassword is set to the hash of the input password.
* The new User's additionalCredentials map is initialized as empty.
* The identifier of the newly created User is returned.

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

***

### POST /api/UserAuthentication/login

**Description:** Authenticates a user with provided credentials and establishes a new session.

**Requirements:**

* A User must exist with the provided username and their hashed password must match the hash of the provided password.

**Effects:**

* The User matching the username is found.
* A new unique sessionToken is created.
* A new active session linking the found User and the new sessionToken is added to activeSessions.
* The new sessionToken is returned.

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

***

### POST /api/UserAuthentication/logout

**Description:** Terminates an active user session by invalidating its token.

**Requirements:**

* An active session must exist with the provided sessionToken.

**Effects:**

* The active session with the matching sessionToken is removed from activeSessions.
* A success boolean is returned.

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

***

### POST /api/UserAuthentication/getCurrentUser

**Description:** Retrieves the identifier of the authenticated user for a given active session.

**Requirements:**

* An active session must exist with the provided sessionToken.

**Effects:**

* The user associated with the matching sessionToken is found.
* The identifier of the found user is returned.

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

***

### POST /api/UserAuthentication/storeCredential

**Description:** Saves an additional credential for the authenticated user under a specified type.

**Requirements:**

* An active session must exist with the provided sessionToken.
* The credentialType must not be an empty string.

**Effects:**

* The user associated with the matching sessionToken is found.
* The user's additionalCredentials map is updated with the credentialType and credentialValue.
* A success boolean is returned.

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

***

### POST /api/UserAuthentication/retrieveCredential

**Description:** Fetches a specific additional credential associated with the authenticated user and a given type.

**Requirements:**

* An active session must exist with the provided sessionToken.
* The user associated with the sessionToken must have an additional credential stored under the given credentialType.

**Effects:**

* The user associated with the matching sessionToken is found.
* The credentialValue for the specified credentialType is returned.

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

***

### POST /api/UserAuthentication/updateCredential

**Description:** Modifies an existing additional credential for the authenticated user.

**Requirements:**

* An active session must exist with the provided sessionToken.
* The credentialType must not be an empty string.
* The user associated with the sessionToken must already have an additional credential stored under the given credentialType.

**Effects:**

* The user associated with the matching sessionToken is found.
* The user's additionalCredentials map is updated with the newCredentialValue for the specified credentialType.
* A success boolean is returned.

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

***

### POST /api/UserAuthentication/deleteCredential

**Description:** Removes a specific additional credential from the authenticated user's stored credentials.

**Requirements:**

* An active session must exist with the provided sessionToken.
* The user associated with the sessionToken must have an additional credential stored under the given credentialType.

**Effects:**

* The user associated with the matching sessionToken is found.
* The specified credentialType and its value are removed from the user's additionalCredentials.
* A success boolean is returned.

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

***

### POST /api/UserAuthentication/getCredentialTypes

**Description:** Lists all credential types stored for the authenticated user.

**Requirements:**

* An active session must exist with the provided sessionToken.

**Effects:**

* The user associated with the matching sessionToken is found.
* A set of all credential types (keys) from the user's additionalCredentials is returned.

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
