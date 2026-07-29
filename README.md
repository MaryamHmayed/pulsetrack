# PulseTrack

PulseTrack is a responsive diabetes remote-monitoring platform built for the
Capadev Software Engineer Challenge. It includes the required Tier 1 platform,
the Tier 2 FHIR R4 integration, and an evidence-backed Tier 3 AI review.

| | Link |
| --- | --- |
| Live application | [pulsetrack-seven.vercel.app](https://pulsetrack-seven.vercel.app) |
| Repository | [github.com/MaryamHmayed/pulsetrack](https://github.com/MaryamHmayed/pulsetrack) |

## Test login

| Field | Value |
| --- | --- |
| Email | `test@pulsetrack.dev` |
| Password | `TestPassword123!` |

All accounts and clinical records in this challenge use fabricated data.

## Implemented scope

### Tier 1

- Clinician email/password authentication using revocable, hashed database
  sessions; patients do not have accounts.
- Patient CRUD for name, date of birth, sex, MRN, email, and phone, with unique
  MRNs, server-side validation, search, FHIR-status filters, and pagination.
- DSMA-8 delivery through Brevo's transactional email API with a random
  tokenized link, exact supplied questions and scoring, seven-day expiry,
  single-use submission, and clinician-visible `SENT`, `COMPLETED`, and
  `EXPIRED` history. Delivery failures are surfaced without exposing provider
  credentials.
- Fixed CSV template download, row-level validation for missing fields, MRNs,
  dates, test codes, numeric values, and duplicates, plus partial import,
  persisted reports, and patient-specific CSV export.
- Patient charts for glucose, HbA1c, and assessment scores.
- Clinic metrics for assessment completion and patient risk bands, plus recent
  lab imports with an upload-date filter.
- Responsive layouts with explicit loading, empty, validation, and error
  states.

### Tier 2 — FHIR R4

- Creates and updates candidate-owned FHIR `Patient` resources.
- Creates FHIR `Observation` resources for accepted CSV lab results and links
  them to the remote patient.
- Idempotently imports the five supplied read-only patients and their
  historical observations.
- Uses server-only API-key authentication, candidate-scoped conditional
  creates, timeouts, bounded retries, `Retry-After`, safe Bundle pagination,
  stored remote IDs, ownership checks, visible sync states, and manual retry
  actions.

### Tier 3 — AI clinical review

- Gemini produces an on-demand review grounded only in recorded lab and
  completed DSMA-8 evidence.
- The application computes numeric trends and scores before the model call.
- Direct identifiers are excluded from the prompt.
- Every statement must cite valid `LAB-*` or `ASM-*` evidence; invalid output is
  rejected.
- Cross-domain output links objective lab trends with reported self-management
  risk without diagnosing, prescribing, or claiming causation.
- Reviews are auditable, reused for unchanged evidence, marked stale after new
  data, and rate-limited.

## Stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- PostgreSQL with Prisma ORM 7 and the PostgreSQL driver adapter
- Brevo transactional email API
- HAPI FHIR R4
- Google Gemini 3.1 Flash-Lite
- Vercel

## Local setup

### Prerequisites

- Node.js 22+
- PostgreSQL
- Brevo API key and verified sender email
- Challenge FHIR base URL, candidate ID, and API key
- Google AI Studio API key for Tier 3

### 1. Install

```bash
git clone https://github.com/MaryamHmayed/pulsetrack.git
cd pulsetrack
npm ci
```

### 2. Configure

Copy `.env.example` to `.env` and provide:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full"
APP_URL="http://localhost:3000"
BREVO_API_KEY="xkeysib-your-key"
BREVO_SENDER_EMAIL="your-verified-sender@example.com"
BREVO_SENDER_NAME="PulseTrack"

FHIR_BASE_URL="https://fhir-challenge.vihagent.net/fhir"
FHIR_CANDIDATE_ID="cand-your-id"
FHIR_API_KEY="your-personal-api-key"

GEMINI_API_KEY="your-google-ai-studio-key"
GEMINI_MODEL="gemini-3.1-flash-lite"
```

`BREVO_SENDER_EMAIL` must exactly match a sender verified in Brevo. The API key
is read only by server-side email code and must never use a `NEXT_PUBLIC_`
prefix. Use only fabricated patient identities and test inboxes.

### 3. Prepare and run

```bash
npx prisma migrate deploy
npm run seed
npm run fhir:import-history -- test@pulsetrack.dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and use the test login
above. The seed and historical FHIR import are idempotent.

### 4. Verify

```bash
npm run fhir:check
npm run ai:check
npm test
npm run lint
npm run build
```

## Reviewer walkthrough

1. Sign in and create, search, edit, and inspect a patient.
2. Set a fabricated patient's email to an inbox you own and send the DSMA-8.
   Submit all eight answers, then reopen the link to confirm it is single-use.
3. Download the lab template and upload a CSV containing valid and invalid
   rows. Review the per-row reasons and confirm valid rows still import.
4. Upload the same file again and confirm duplicate rows are rejected without
   creating additional results.
5. Inspect patient lab and assessment charts, then review clinic metrics and
   filter recent imports by date.
6. Create or edit a local patient and confirm FHIR synchronization. Import a
   lab result and confirm its linked Observation status.
7. Confirm the five read-only FHIR-history patients appear alongside local
   records. Re-run the import command to verify idempotency.
8. Generate an AI review, open its cited evidence, and add new clinical data to
   confirm the review becomes stale.

## Architecture

```mermaid
flowchart LR
    C[Clinician browser]
    P[Patient browser]

    subgraph V[PulseTrack on Vercel]
        N[Next.js App Router]
        A[Server Components and Server Actions]
        S[Clinician-scoped services]
        O[Prisma Client]
    end

    DB[(PostgreSQL)]
    R[Brevo transactional email API]
    F[HAPI FHIR R4]
    G[Google Gemini]

    C -->|HTTPS + session cookie| N
    P -->|HTTPS + single-use token| N
    N --> A --> S
    S --> O --> DB
    S -->|assessment email| R
    S <-->|Patient and Observation| F
    S -->|de-identified evidence| G
    G -->|schema-constrained review| S
```

Database and provider credentials are available only to server code. Every
clinician-facing read and mutation is scoped to the authenticated clinician.
The public assessment route grants access only to one assessment through its
high-entropy, expiring token.

## FHIR integration flow

```mermaid
flowchart LR
    UI[Clinician action]
    APP[PulseTrack]
    DB[(PostgreSQL)]
    FHIR[Shared HAPI FHIR R4 server]

    UI -->|Create or edit patient| APP
    APP -->|Candidate-scoped conditional POST or owned PUT Patient| FHIR
    FHIR -->|Resource ID or bounded error| APP
    APP -->|Save sync state| DB

    UI -->|Upload CSV| APP
    APP -->|Store valid lab rows| DB
    APP -->|Candidate-scoped conditional POST Observation| FHIR
    FHIR -->|Resource ID or bounded error| APP

    FHIR -->|Search seeded Patient and Observation Bundles| APP
    APP -->|Validate, map, and idempotently import as read-only| DB
```

Local test codes map to LOINC (`GLU-F` → `1558-6`, `HBA1C` → `4548-4`,
`SBP` → `8480-6`). Candidate-owned resources can be updated; shared seed
resources remain read-only.

## Entity relationship diagram

```mermaid
erDiagram
    CLINICIAN ||--o{ SESSION : has
    CLINICIAN ||--o{ PATIENT : manages
    CLINICIAN ||--o{ LAB_IMPORT : uploads
    CLINICIAN ||--o{ CLINICAL_REVIEW : generates
    PATIENT ||--o{ ASSESSMENT : receives
    PATIENT ||--o{ LAB_RESULT : has
    PATIENT ||--o{ CLINICAL_REVIEW : has
    LAB_IMPORT o|--o{ LAB_RESULT : creates

    CLINICIAN {
        string id PK
        string email UK
        string passwordHash
    }
    SESSION {
        string id PK
        string clinicianId FK
        string tokenHash UK
        datetime expiresAt
    }
    PATIENT {
        string id PK
        string clinicianId FK
        string mrn UK
        string fullName
        date dob
        string fhirResourceId UK
        enum fhirSyncStatus
    }
    ASSESSMENT {
        string id PK
        string patientId FK
        string tokenHash UK
        enum status
        datetime expiresAt
        int score
        enum riskBand
    }
    LAB_IMPORT {
        string id PK
        string clinicianId FK
        int acceptedCount
        int rejectedCount
        json report
    }
    LAB_RESULT {
        string id PK
        string patientId FK
        string importId FK
        date collectedDate
        string testCode
        decimal value
        string fhirResourceId UK
    }
    CLINICAL_REVIEW {
        string id PK
        string patientId FK
        string clinicianId FK
        string inputHash
        json evidence
        json review
    }
```

Lab results are unique by `(patientId, collectedDate, testCode)`.

## Security

- Passwords use bcrypt; session and assessment tokens are random and stored
  only as SHA-256 hashes.
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Prisma uses parameterized queries; concurrency-sensitive imports and
  assessment completion use serializable transactions.
- Patient, CSV, and questionnaire inputs are validated on the server.
- Secrets remain server-only and `.env` files are ignored by Git.
- FHIR ownership is checked before updates; credentials are never placed in
  logs or cross-origin pagination requests.
- Gemini receives bounded, de-identified evidence and its citations are
  validated before persistence.

This is a challenge application using fabricated data, not a certified medical
device or production clinical record system.

## Decisions & tradeoffs

| Decision | Rationale and next step |
| --- | --- |
| Opaque database sessions | Simple to audit and immediately revocable. A production clinic would add a mature identity provider, MFA, password reset, rate limiting, and security audit events. |
| Strict partial CSV import | Valid rows are retained while ambiguous rows receive explicit reasons. Larger files would use streaming, object storage, and background processing. |
| Immediate FHIR synchronization | Makes status and failures visible during the challenge. Production would use an outbox, durable workers, dead-letter handling, and monitoring. |
| Read-only historical FHIR data | Preserves shared-server ownership while allowing local contact details. A recurring feed would use monitored incremental synchronization. |
| Evidence-backed AI | Keeps output narrow, cited, and clinician-verifiable. Clinical deployment would require formal evaluation, prompt/version governance, human-factors testing, and an approved provider agreement. |
| No hard deletion of lab imports | Preserves clinical and synchronization history. Production would use a reasoned void/correction workflow and retention policy. |

## Deployment

1. Import the repository into Vercel.
2. Add the environment variables listed above and set `APP_URL` to the final
   HTTPS deployment origin.
3. Deploy, run `npm run seed` against the production database, and run
   `npm run fhir:import-history -- test@pulsetrack.dev`.
4. Verify login, email delivery, CSV import, FHIR push/pull, and AI citations.

Do not expose any secret through a `NEXT_PUBLIC_` variable.
