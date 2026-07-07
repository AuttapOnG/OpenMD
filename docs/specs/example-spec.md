# Spec: Add user authentication endpoint

**Status:** approved
**Date:** 2026-06-30

## Goal
Add a POST /auth/login endpoint that accepts email + password and returns a JWT token.

## Background
The app currently has no authentication. Users are identified by session only.
The agent should not modify any existing endpoints or database schema.

## Requirements
- [ ] POST /auth/login accepts { email, password }
- [ ] Returns { token, expiresAt } on success
- [ ] Returns 401 on invalid credentials
- [ ] Token expires in 24 hours

## Out of Scope
- Registration endpoint
- Password reset
- OAuth / social login

## Success Criteria
- curl -X POST /auth/login -d '{"email":"test@example.com","password":"secret"}' returns 200 with token
- Invalid password returns 401
- Token validates with jwt.verify()
