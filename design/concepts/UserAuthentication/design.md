# UserAuthentication - Design Decisions

## Overview
This document explains the key design decisions made during the development of the UserAuthentication concept. This is a brand new concept that I created that did not exist in Assignment 2.

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

## Design Decision 4: No Session Expiration

**Decision**: Sessions persist indefinitely until explicit logout.

**Rationale**: Keeps implementation simple; persistent sessions acceptable for student use case.

