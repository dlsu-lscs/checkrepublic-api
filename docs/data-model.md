# Check Republic API — Database Schema & Data Flow

This document defines the PostgreSQL data model, custom ENUM types, entity relationships, and request flow for **Check Republic API** (`checkrepublic-api`) supporting Sprint 1 MVP user stories (`CR-US-01` through `CR-US-06`).

---

## 1. PostgreSQL Custom ENUM Types

```sql
CREATE TYPE audit_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);

CREATE TYPE audit_result AS ENUM (
    'READY',
    'NEEDS_REVISION',
    'BLOCKED'
);

CREATE TYPE document_role AS ENUM (
    'PROPOSAL',
    'MOA',
    'ATTACHMENT'
);

CREATE TYPE rule_category AS ENUM (
    'PRE_ACTS_SECTION',
    'SIGNATORY',
    'TIE_UP_MOA'
);

CREATE TYPE finding_severity AS ENUM (
    'BLOCKING',
    'WARNING',
    'INFO'
);
```

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : "has"
    USERS ||--o{ PROJECTS : "creates"
    USERS ||--o{ DOCUMENTS : "uploads"
    USERS ||--o{ AUDIT_RUNS : "initiates"

    PROJECTS ||--o{ DOCUMENTS : "contains"
    PROJECTS ||--o{ AUDIT_RUNS : "has"

    AUDIT_RUNS ||--o{ AUDIT_FINDINGS : "produces"
    DOCUMENTS ||--o{ AUDIT_FINDINGS : "referenced in"

    USERS {
        uuid id PK
        string email UK "Only @dlsu.edu.ph"
        string full_name
        string avatar_url
        timestamptz created_at
        timestamptz updated_at
    }

    SESSIONS {
        uuid id PK
        uuid user_id FK
        string refresh_token_hash
        timestamptz expires_at
        timestamptz created_at
        timestamptz revoked_at
    }

    PROJECTS {
        uuid project_id PK
        uuid user_id FK
        string project_name
        timestamptz created_at
        timestamptz modified_at
        boolean is_deleted
    }

    DOCUMENTS {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        document_role document_role "ENUM"
        string original_filename
        string mime_type "pdf, docx, xlsx"
        bigint size_bytes
        string s3_key "Garage bucket object key"
        string file_url "Accessible storage URL"
        timestamptz created_at
        timestamptz updated_at
        boolean is_deleted
    }

    AUDIT_RUNS {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        audit_status status "ENUM"
        audit_result overall_result "ENUM, nullable"
        string model_used "e.g. gemini-2.5-flash"
        timestamptz created_at
        timestamptz completed_at
    }

    AUDIT_FINDINGS {
        uuid id PK
        uuid audit_id FK
        uuid document_id FK
        rule_category rule_category "ENUM"
        finding_severity severity "ENUM"
        string target_section "e.g. Signatory Block 2"
        string reason "Why it failed or was flagged"
        string recommendation "Actionable next step"
        timestamptz created_at
    }
```

---

## 3. Data Lifecycle & Request Flow

```mermaid
flowchart LR
    A["POST /api/documents/upload"] -->|Store file| B[("S3 Garage Bucket")]
    A -->|Insert record| C[("DOCUMENTS Table (PostgreSQL)")]

    D["POST /api/audit/document"] -->|Fetch files| B
    D -->|Convert| E["Markdown Parser"]
    E -->|Prompt Context| F["LLM (Gemini)"]

    F -->|Structured Output| G[("AUDIT_RUNS Table")]
    G -->|Bulk insert findings| H[("AUDIT_FINDINGS Table")]
    H -->|Return JSON| I["Frontend Findings Inspector"]
```

---

## 4. PostgreSQL Table Specifications

### `users`
Tracks authorized DLSU users authenticated via Google OAuth (`CR-US-05`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | DLSU email address (`*@dlsu.edu.ph`) |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Display name from Google OAuth |
| `avatar_url` | `TEXT` | `NULL` | Profile avatar URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Update timestamp |

---

### `sessions`
Maintains user login sessions and refresh token lifecycle (`CR-US-06`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique session identifier |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Associated user |
| `refresh_token_hash` | `TEXT` | `NOT NULL` | Secure hash of the issued refresh token |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Token expiration timestamp |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when user signed out / revoked |

---

### `projects`
Represents a project or event package containing multiple activity documents (`CR-US-01`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `project_id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique project identifier |
| `project_name` | `VARCHAR(255)` | `NOT NULL` | Name of the project or event |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Associated user / owner |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `modified_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last modified timestamp |
| `is_deleted` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Soft deletion status flag |

---

### `documents`
Stores metadata and object storage pointers for files uploaded by users (`CR-US-01`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique document identifier |
| `project_id` | `UUID` | `NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE` | Associated project ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Uploader ID |
| `document_role` | `document_role` | `NOT NULL DEFAULT 'ATTACHMENT'` | `PROPOSAL`, `MOA`, `ATTACHMENT` |
| `original_filename` | `VARCHAR(255)` | `NOT NULL` | Original client filename |
| `mime_type` | `VARCHAR(128)` | `NOT NULL` | Approved MIME type (`pdf`, `docx`, `xlsx`) |
| `size_bytes` | `BIGINT` | `NOT NULL` | File size in bytes (max 25 MB) |
| `s3_key` | `TEXT` | `NOT NULL` | Object storage key in S3 Garage bucket |
| `file_url` | `TEXT` | `NOT NULL` | Accessible storage URL |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Upload timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Update timestamp |
| `is_deleted` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Soft deletion status flag |

---

### `audit_runs`
Records each execution of the document compliance audit pipeline (`CR-US-02`, `CR-US-03`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique audit run identifier |
| `project_id` | `UUID` | `NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE` | Associated project ID |
| `user_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Triggering user |
| `status` | `audit_status` | `NOT NULL DEFAULT 'PENDING'` | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| `overall_result` | `audit_result` | `NULL` | `READY`, `NEEDS_REVISION`, `BLOCKED` |
| `model_used` | `VARCHAR(64)` | `NULL` | Model identifier (e.g. `gemini-2.5-flash`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Audit start timestamp |
| `completed_at` | `TIMESTAMPTZ` | `NULL` | Audit completion timestamp |

---

### `audit_findings`
Actionable compliance findings generated by the LLM audit engine (`CR-US-04`).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique finding identifier |
| `audit_id` | `UUID` | `NOT NULL REFERENCES audit_runs(id) ON DELETE CASCADE` | Associated audit run |
| `document_id` | `UUID` | `NOT NULL REFERENCES documents(id) ON DELETE CASCADE` | Associated document (proposal or MOA) |
| `rule_category` | `rule_category` | `NOT NULL` | `PRE_ACTS_SECTION`, `SIGNATORY`, `TIE_UP_MOA` |
| `severity` | `finding_severity` | `NOT NULL` | `BLOCKING`, `WARNING`, `INFO` |
| `target_section` | `VARCHAR(255)` | `NULL` | Affected section or page |
| `reason` | `TEXT` | `NOT NULL` | Why it failed or was flagged |
| `recommendation` | `TEXT` | `NOT NULL` | Actionable instruction for the user |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Finding timestamp |

---

## 5. Mapping to Sprint 1 User Stories

* **`CR-US-01` (Document Upload & Package Preparation):** Handled by `projects` (audit package container), `documents`, and S3 Garage storage.
* **`CR-US-02` (Pre-Acts Evaluation):** Evaluates proposal sections and signatories, stored in `audit_findings` under `rule_category = 'PRE_ACTS_SECTION'` and `'SIGNATORY'`.
* **`CR-US-03` (Tie-Up ↔ MOA Consistency):** Uses `documents` filtered by `document_role = 'PROPOSAL'` vs `'MOA'`; outputs findings under `rule_category = 'TIE_UP_MOA'`.
* **`CR-US-04` (Audit Findings Breakdown):** Queries `audit_runs` and `audit_findings` filtered by `severity` (`BLOCKING`, `WARNING`, `INFO`).
* **`CR-US-05` & `CR-US-06` (Google Sign-In & Sessions):** Handled by `users` and `sessions`.
