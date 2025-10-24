// src/concepts/UserAuthentication/UserAuthenticationConcept.ts
// Concept implementation for user authentication and credential management

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { hashPassword, comparePassword } from "@utils/password.ts";

// Declare collection prefix, use concept name
const PREFIX = "UserAuthentication" + ".";

// Generic types of this concept
type User = ID;

/**
 * UserDoc represents a user in the authentication system
 *
 * State specification:
 * - username: String (unique identifier for the user)
 * - hashedPassword: String (bcrypt hash of the user's password)
 * - additionalCredentials: Map<String, String> (maps credential type to credential value, e.g., "Canvas" -> API token)
 */
interface UserDoc {
  _id: User;
  username: string;
  hashedPassword: string;
  additionalCredentials: Record<string, string>; // Stored as an object in MongoDB
}

/**
 * a set of activeSessions with
 * user: User // The authenticated user
 * sessionToken: String // A unique identifier for the active session
 */
interface ActiveSessionDoc {
  _id: ID; // session token serves as the ID
  user: User;
  sessionToken: string;
}

export default class UserAuthenticationConcept {
  users: Collection<UserDoc>;
  activeSessions: Collection<ActiveSessionDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
    this.activeSessions = this.db.collection(PREFIX + "activeSessions");
  }

  /**
   * register (username: String, password: String): (user: User)
   *
   * **requires** not (exists User u where u.username = username)
   *
   * **effects**
   * create new User called newUser
   * newUser.username := username
   * newUser.hashedPassword := hash(password)
   * newUser.additionalCredentials := an empty Map
   * return user := newUser
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Check precondition: username must be unique
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already taken" };
    }

    const hashedPassword = await hashPassword(password);
    const newUser: UserDoc = {
      _id: freshID() as User, // Assign a fresh ID
      username,
      hashedPassword,
      additionalCredentials: {}, // Initialize as empty map
    };

    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * login (username: String, password: String): (sessionToken: String)
   *
   * **requires** exists User u where u.username = username and u.hashedPassword = hash(password)
   *
   * **effects**
   * let user_found be the User u where u.username = username
   * create new unique sessionToken called newSessionToken
   * add {user: user_found, sessionToken: newSessionToken} to activeSessions
   * return sessionToken := newSessionToken
   */
  async login(
    { username, password }: { username: string; password: string },
  ): Promise<{ sessionToken: string } | { error: string }> {
    // Check precondition: user exists and password matches
    const user = await this.users.findOne({ username });
    if (!user) {
      return { error: "Invalid username or password" };
    }

    const passwordMatches = await comparePassword(password, user.hashedPassword);
    if (!passwordMatches) {
      return { error: "Invalid username or password" };
    }

    const newSessionToken = freshID(); // Generate a unique session token
    const newActiveSession: ActiveSessionDoc = {
      _id: newSessionToken,
      user: user._id,
      sessionToken: newSessionToken,
    };

    await this.activeSessions.insertOne(newActiveSession);
    return { sessionToken: newSessionToken };
  }

  /**
   * logout (sessionToken: String): (success: Boolean)
   *
   * **requires** exists s in activeSessions where s.sessionToken = sessionToken
   *
   * **effects**
   * remove s from activeSessions where s.sessionToken = sessionToken
   * return success := true
   */
  async logout(
    { sessionToken }: { sessionToken: string },
  ): Promise<{ success: boolean } | { error: string }> {
    // Check precondition: session exists
    const result = await this.activeSessions.deleteOne({ sessionToken });

    if (result.deletedCount === 0) {
      return { error: "Invalid session token" };
    }
    return { success: true };
  }

  /**
   * getCurrentUser (sessionToken: String): (user: User)
   *
   * **requires** exists s in activeSessions where s.sessionToken = sessionToken
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * return user := user_found
   */
  async getCurrentUser(
    { sessionToken }: { sessionToken: string },
  ): Promise<{ user: User } | { error: string }> {
    // Check precondition: session exists
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token" };
    }
    return { user: session.user };
  }

  /**
   * storeCredential (sessionToken: String, credentialType: String, credentialValue: String): (success: Boolean)
   *
   * **requires**
   * exists s in activeSessions where s.sessionToken = sessionToken
   * credentialType is not an empty string
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * user_found.additionalCredentials[credentialType] := credentialValue // In a real system, credentialValue would be encrypted
   * return success := true
   */
  async storeCredential(
    { sessionToken, credentialType, credentialValue }: {
      sessionToken: string;
      credentialType: string;
      credentialValue: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    // Check precondition: session exists
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token" };
    }
    if (!credentialType || credentialType.trim() === "") {
      return { error: "Credential type cannot be empty" };
    }

    // Update user's additionalCredentials map
    // MongoDB dot notation allows setting a specific key within the nested object
    await this.users.updateOne(
      { _id: session.user },
      { $set: { [`additionalCredentials.${credentialType}`]: credentialValue } },
    );

    return { success: true };
  }

  /**
   * retrieveCredential (sessionToken: String, credentialType: String): (credentialValue: String)
   *
   * **requires**
   * exists s in activeSessions where s.sessionToken = sessionToken and
   * let user_found be s.user where s.sessionToken = sessionToken and
   * user_found.additionalCredentials contains key credentialType
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * return credentialValue := user_found.additionalCredentials[credentialType]
   */
  async retrieveCredential(
    { sessionToken, credentialType }: {
      sessionToken: string;
      credentialType: string;
    },
  ): Promise<{ credentialValue: string } | { error: string }> {
    // Check precondition: session exists
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token or credential type not found" };
    }

    const user = await this.users.findOne({ _id: session.user });
    if (!user || !user.additionalCredentials?.[credentialType]) {
      return { error: "Invalid session token or credential type not found" };
    }

    return { credentialValue: user.additionalCredentials[credentialType] };
  }

  /**
   * updateCredential (sessionToken: String, credentialType: String, newCredentialValue: String): (success: Boolean)
   *
   * **requires**
   * exists s in activeSessions where s.sessionToken = sessionToken
   * credentialType is not an empty string
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * user_found.additionalCredentials[credentialType] := newCredentialValue
   * return success := true
   */
  async updateCredential(
    { sessionToken, credentialType, newCredentialValue }: {
      sessionToken: string;
      credentialType: string;
      newCredentialValue: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    // Precondition check: session exists
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token" };
    }
    if (!credentialType || credentialType.trim() === "") {
      return { error: "Credential type cannot be empty" };
    }

    // Ensure the credentialType exists before updating
    const user = await this.users.findOne({ _id: session.user });
    if (!user || !user.additionalCredentials?.[credentialType]) {
      return { error: "Credential type not found for this user" };
    }

    await this.users.updateOne(
      { _id: session.user },
      { $set: { [`additionalCredentials.${credentialType}`]: newCredentialValue } },
    );

    return { success: true };
  }

  /**
   * deleteCredential (sessionToken: String, credentialType: String): (success: Boolean)
   *
   * **requires**
   * exists s in activeSessions where s.sessionToken = sessionToken and
   * let user_found be s.user where s.sessionToken = sessionToken and
   * user_found.additionalCredentials contains key credentialType
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * remove credentialType from user_found.additionalCredentials
   * return success := true
   */
  async deleteCredential(
    { sessionToken, credentialType }: {
      sessionToken: string;
      credentialType: string;
    },
  ): Promise<{ success: boolean } | { error: string }> {
    // Check precondition: session exists and credential type exists for the user
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token or credential type not found" };
    }

    const user = await this.users.findOne({ _id: session.user });
    if (!user || !user.additionalCredentials?.[credentialType]) {
      return { error: "Invalid session token or credential type not found" };
    }

    // Remove the credential using $unset
    const updateResult = await this.users.updateOne(
      { _id: session.user },
      { $unset: { [`additionalCredentials.${credentialType}`]: "" } }, // $unset removes the field
    );

    if (updateResult.modifiedCount === 0) {
      return { error: "Failed to delete credential (user not found or not modified)" };
    }

    return { success: true };
  }

  /**
   * getCredentialTypes (sessionToken: String): (types: set of String)
   *
   * **requires** exists s in activeSessions where s.sessionToken = sessionToken
   *
   * **effects**
   * let user_found be s.user where s.sessionToken = sessionToken
   * return types := keys of user_found.additionalCredentials
   */
  async getCredentialTypes(
    { sessionToken }: { sessionToken: string },
  ): Promise<{ types: string[] } | { error: string }> {
    // Check precondition: session exists
    const session = await this.activeSessions.findOne({ sessionToken });
    if (!session) {
      return { error: "Invalid session token" };
    }

    const user = await this.users.findOne({ _id: session.user });
    if (!user) {
      // This case should ideally not happen if session.user always points to an existing user
      return { error: "Associated user not found for session" };
    }

    return { types: Object.keys(user.additionalCredentials || {}) };
  }
}