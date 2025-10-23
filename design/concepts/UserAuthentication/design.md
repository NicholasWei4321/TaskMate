# UserAuthentication - Design Decisions

## Overview
This document explains the key design decisions made during the development of the UserAuthentication concept.

## Design Decision 1: Password Hashing

**Decision**: Store hashed passwords instead of plaintext using `hash(password)`.

**Rationale**: Security requirement - passwords must never be stored in plaintext.

**Implementation**: Use bcrypt or argon2 with salt for secure one-way hashing.

## Design Decision 2: Session Token-Based Authentication

**Decision**: Use session tokens to maintain authenticated state rather than passing username/password repeatedly.

**Rationale**: Provides secure, revocable access without exposing credentials on every request.

**Implementation**: Store `activeSessions` mapping session tokens to users; validate token on each authenticated action.

## Design Decision 3: Additional Credentials Storage

**Decision**: Store external system credentials (Canvas, GitHub) in `additionalCredentials` map.

**Rationale**: TaskMate needs to import tasks from external platforms, requiring stored credentials for those systems.

**Implementation**: Use encrypted key-value map where key is credential type (e.g., "Canvas") and value is encrypted credential string.

## Design Decision 4: Credential Management

**Decision**: Provide full CRUD operations for credentials: store, retrieve, update, delete, and list types.

**Rationale**: Users need to manage their stored credentials (update when passwords change, remove unused ones, see what's stored).

**Implementation**: Actions require valid session token and operate on user's `additionalCredentials` map.

## Design Decision 5: No Session Expiration

**Decision**: Sessions persist indefinitely until explicit logout.

**Rationale**: Keeps implementation simple; persistent sessions acceptable for student use case.

**Implementation**: Sessions only removed via logout action; no automatic timeout or cleanup.

## Design Decision 7: Username Uniqueness

**Decision**: Usernames must be globally unique across all users.

**Rationale**: Simplifies authentication and prevents user confusion.

**Implementation**: Database unique index on username field; registration checks before creating user.
