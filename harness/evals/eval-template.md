# Eval: [Task Name]

**Purpose:** Verify the agent can [specific capability] correctly.

## Setup
```bash
# Commands to set up the test environment
```

## Task Prompt
Give the agent exactly this prompt:
> [Exact prompt text]

## Verifier
Run after the agent claims completion:
```bash
# Deterministic check command
# Expected output or exit code
```

## Pass Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Baseline (no skill)
Without the skill, the agent typically: [describe failure mode]
