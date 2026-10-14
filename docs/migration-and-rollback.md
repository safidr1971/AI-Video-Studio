# Database Migration & Rollback Guide

## 1. Overview
AI Video Studio previously operated with a local JSON-backed flat file (`data/app_data.json`). The application has now migrated to **Cloud Firestore** (`server/firestoreDb.ts`) backed by Firebase Authentication and Firestore security rules.

## 2. Data Preservation Policy
- **No Automatic Data Deletion**: In accordance with enterprise safety standards, `data/app_data.json` is preserved untouched on the filesystem.
- **Backup Before Production Migration**: Before running any batch migration into a production Firestore instance, export an immutable copy of `data/app_data.json` with a timestamp:
  ```bash
  cp data/app_data.json data/backups/app_data_backup_$(date +%Y%m%d_%H%M%S).json
  ```

## 3. Migration Procedure (JSON to Firestore)
1. **Prerequisites**:
   - Ensure `firebase-applet-config.json` exists with valid project credentials or `FIREBASE_PROJECT_ID` is set.
   - Verify network access to Firestore.
2. **Data Structure Validation**:
   - The JSON data schema directly conforms to the `Project`, `StoryCategory`, and `AuditEvent` types declared in `src/types.ts`.
   - Projects in `data/app_data.json` without an explicit `ownerId` should be assigned to the primary migration administrator UID.
3. **Execution**:
   - The Firestore service (`server/firestoreDb.ts`) operates transparently in mock mode in local/test environments (`USE_FIRESTORE_MOCK=true`), and directly connects to Google Cloud Firestore when credentials are provisioned.
   - To seed initial categories or historical projects into Firestore, use the initial collections in `server/firestoreDb.ts` which automatically initialize default story categories if the collection is empty.

## 4. Rollback Strategy
If a rollback is ever necessary:
1. **In-Flight Data Snapshot**:
   - Export existing Firestore collections (`projects`, `categories`, `audit_logs`) to JSON format before reverting.
2. **Environment Configuration Reversion**:
   - Setting `USE_FIRESTORE_MOCK=true` runs the memory-isolated model for emergency recovery or offline maintenance without disturbing existing cloud data.
3. **Audit Log Inspection**:
   - Review `/api/audit-logs` or the `audit_logs` collection to determine state prior to rollback.

## 5. Security & Deployment Notes
- **Local Development Tokens**:
  - `ALLOW_DEV_TOKEN=true` enables developer bypass tokens (`dev-token-*`) in non-production environments.
  - Server startup explicitly throws a fatal error and terminates if `ALLOW_DEV_TOKEN=true` is set when `NODE_ENV=production`.
- **Reverse Proxy / IP Trust**:
  - `TRUST_PROXY` must be configured according to your proxy topology (e.g. `1` for Google Cloud Run). Blindly trusting `true` is prohibited to prevent IP spoofing in rate limiters.
