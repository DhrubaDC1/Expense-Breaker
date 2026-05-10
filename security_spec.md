# Security Specification — ClearLedger

## 1. Data Invariants
- A transaction must belong to a user or a shared space.
- A user can only read/write their own personal data.
- Shared space data is only accessible to members of that space.
- Amounts must be positive numbers.
- Timestamps must be server-validated.

## 2. The Dirty Dozen Payloads (Rejection Tests)
1. **Identity Spoofing**: Attempt to create a transaction with `userId` of another user.
2. **Access Breach**: Attempt to read `users/victim_id/transactions/any`.
3. **Ghost Field Injection**: Attempt to add `admin: true` to a user profile or transaction.
4. **Invalid Type**: Send `amount: "one million"` (string instead of number).
5. **ID Poisoning**: Attempt to use a 2MB string as a `transactionId`.
6. **Relational Sync Bypass**: Update a transaction in a shared space where the user is no longer a member.
7. **Negative Value**: Create a transaction with `amount: -100`.
8. **Client Timestamp Manipulation**: Set `createdAt` to 10 years in the future.
9. **Terminal State Lockdown**: Try to modify a "finalized" transaction (if we implement a closed flag).
10. **Array Explosion**: Send a `members` list with 1 million entries.
11. **PII Leakage**: Try to list all users to find emails.
12. **Orphaned Writes**: Create a budget for a category that doesn't exist in the system's global list.

## 3. Test Runner Scenarios
All the above payloads MUST return `PERMISSION_DENIED`.
