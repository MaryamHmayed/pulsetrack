# PulseTrack

PulseTrack is a responsive remote patient monitoring platform for a diabetes
clinic. Clinicians can manage patients, email the DSMA-8 self-assessment,
import lab results from CSV, and monitor clinical activity through clinic and
patient dashboards.

This repository contains the completed **Tier 1 and Tier 2** scope of the
Capadev Software Engineer Challenge.

- Repository: [github.com/MaryamHmayed/pulsetrack](https://github.com/MaryamHmayed/pulsetrack)
- Live application: [pulsetrack-seven.vercel.app](https://pulsetrack-seven.vercel.app)

## Test clinician

The seed command creates this fabricated clinician account:

| Field | Value |
| --- | --- |
| Email | `test@pulsetrack.dev` |
| Password | `TestPassword123!` |

Only fabricated patient and clinical data should be used with this application.

## Tier 1 coverage

| Requirement | Implementation |
| --- | --- |
| Authentication | Email/password clinician login backed by revocable, database-stored sessions |
| Patient management | Create, read, update, and delete patients; unique MRN; server-side validation; search by name, MRN, email, or phone |
| DSMA-8 assessment | Resend email delivery, unique tokenized public link, all eight required questions, exact supplied scoring, seven-day expiry, single-use submission, and clinician-visible history |
| Lab CSV import | In-app template download, partial import, persisted row-level report, duplicate protection, and patient-specific CSV export |
| Patient dashboard | Glucose and HbA1c time-series charts with reference ranges, lab history, and assessment-score history |
| Clinic dashboard | Aggregate counts, completion rate, latest patient risk-band distribution, recent imports, and an upload-date filter |
| UX states | Responsive layouts plus intentional loading, empty, validation, and error states |

## Tier 2 FHIR coverage

| Requirement | Implementation |
| --- | --- |
| Patient push | Local patient creation uses an idempotent conditional `Patient` create; later edits update the specific candidate-owned FHIR resource |
| Observation push | Every accepted local CSV row is mapped to a LOINC-coded `Observation` linked to the patient's FHIR resource |
| Historical pull | One clinician action imports the five supplied MRNs and their 180 historical observations into the existing patient dashboards |
| Idempotency | Conditional creates, stored FHIR resource IDs, database uniqueness constraints, and import matching prevent duplicate patients and observations |
| External API handling | Server-only API-key authentication, ten-second request timeouts, bounded retries, `Retry-After` support, safe pagination, validated FHIR responses, and visible per-resource failure states |
| Shared-server isolation | Candidate-owned resources may be updated; imported seed resources are marked read-only and never written back |

## Technology

- Next.js 16 App Router and React 19
- TypeScript
- PostgreSQL
- Prisma ORM 7 with the PostgreSQL driver adapter
- Tailwind CSS 4
- Resend transactional email API
- Node.js built-in test runner

## Local setup

### Prerequisites

- Node.js 22 or newer
- npm
- A PostgreSQL database
- A Resend account and API key for real email delivery

### 1. Install the project

```bash
git clone https://github.com/MaryamHmayed/pulsetrack.git
cd pulsetrack
npm ci
```

### 2. Configure the environment

Copy `.env.example` to `.env`, then set:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=verify-full"
EMAIL_DELIVERY_MODE="resend"
APP_URL="http://localhost:3000"
RESEND_API_KEY="re_your_key"
EMAIL_FROM="PulseTrack <onboarding@resend.dev>"
FHIR_BASE_URL="https://fhir-challenge.vihagent.net/fhir"
FHIR_CANDIDATE_ID="cand-your-id"
FHIR_API_KEY="your-personal-api-key"
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma |
| `EMAIL_DELIVERY_MODE` | `resend` for real delivery; `preview` is available only for explicit local testing |
| `APP_URL` | Origin placed in assessment links; must be the deployed HTTPS URL in production |
| `RESEND_API_KEY` | Server-only Resend credential |
| `EMAIL_FROM` | Sender accepted by Resend |
| `FHIR_BASE_URL` | HTTPS base URL of the HAPI FHIR R4 server |
| `FHIR_CANDIDATE_ID` | Candidate ownership tag issued with the challenge |
| `FHIR_API_KEY` | Personal server-only credential sent as `X-API-Key` |

`onboarding@resend.dev` is Resend's testing sender and can deliver only to the
email address associated with the Resend account. To test with it, update a
fabricated patient's email in PulseTrack to that address. A verified sender
domain is required to deliver to arbitrary recipients.

Never commit `.env` or expose `RESEND_API_KEY` or `FHIR_API_KEY` to browser
code.

### 3. Prepare the database and start the app

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the test
clinician above.

The seed is idempotent: it upserts the test clinician and three fabricated
patients instead of creating duplicates.

Confirm the configured FHIR connection before testing synchronization:

```bash
npm run fhir:check
```

### Optional local email preview

When email delivery is not being tested, local development can expose the
generated assessment link directly:

```dotenv
EMAIL_DELIVERY_MODE="preview"
```

Preview mode is rejected in production so the deployed application cannot
silently replace required email delivery with an on-screen link.

## Verification

```bash
npm test
npm run lint
npm run build
```

The automated tests cover assessment-token security, DSMA-8 scoring
boundaries, patient validation, CSV parsing and row validation, lab export
safety, date ranges, chart calculations, dashboard metrics, email-mode
restrictions, FHIR configuration and mappings, authenticated transport,
pagination, retries, ownership checks, historical-resource selection,
idempotency helpers, and bounded provider errors.

## Reviewer walkthrough

1. Sign in as the seeded test clinician.
2. Search the patient list, create a patient, edit it, and inspect its detail
   page.
3. Set a fabricated patient's email to the permitted test inbox and click
   **Send assessment**.
4. Open the emailed link, answer all eight questions, and submit it.
5. Reopen the link to verify that it is single-use, then inspect the score and
   risk band in the patient's assessment history.
6. Open **Lab results**, download the fixed template, and upload a CSV.
7. Inspect accepted and rejected rows in the validation report. Re-upload the
   same file to verify duplicate rejection.
8. Review the imported results and trend charts on the matching patient, then
   download that patient's accepted results as CSV.
9. Review clinic metrics and filter recent uploads by date.
10. Create a new patient and confirm its badge changes to **FHIR synced**.
    Edit it and confirm the same FHIR resource is updated.
11. Upload a new lab row for that patient and confirm its Observation badge is
    **Synced**. Re-upload the row to confirm duplicate rejection.
12. On **Patients**, select **Import FHIR history**. Confirm five read-only
    patients and 180 observations appear in the patient and clinic dashboards.
    Run the import again and confirm that it creates nothing twice.

## FHIR synchronization

PulseTrack implements the required subset of FHIR R4: `Patient`,
`Observation`, and search `Bundle` pagination.

- Reference: [FHIR R4 Patient](https://hl7.org/fhir/R4/patient.html),
  [Observation](https://hl7.org/fhir/R4/observation.html), and
  [Search](https://hl7.org/fhir/R4/search.html).
- MRNs use the identifier system
  `https://challenge.capadev.dev/mrn`.
- Local test codes map to LOINC: `GLU-F` to `1558-6`, `HBA1C` to `4548-4`,
  and `SBP` to `8480-6`.
- Observation values use UCUM quantities and reference the remote patient as
  `Patient/<id>`.
- Patient creation uses `POST Patient` with `If-None-Exist` on the MRN.
  Candidate-owned updates use `PUT Patient/<id>`.
- Observation creation uses `If-None-Exist` with a stable identifier derived
  from the local lab-result ID.
- Historical import searches MRNs `MRN-2001` through `MRN-2005`, follows every
  safe same-origin `next` link, and requires the expected 36 seed observations
  per patient before writing locally.
- Imported seed patients and observations retain their remote resource IDs
  and are marked `READ_ONLY`. Clinicians may maintain local contact details,
  but PulseTrack never sends those local edits back to a seed resource.

Every request sends `X-API-Key` and requests FHIR JSON. The transport times out
after ten seconds and makes up to three attempts for connection failures,
`429`, `502`, `503`, and `504` responses. It honors bounded `Retry-After`
values and otherwise uses exponential backoff. Safe, bounded
`OperationOutcome` diagnostics are stored for failed local resources and shown
to the clinician; credentials and request bodies are not logged.

## CSV contract

The downloadable template uses these headers in this exact order:

```text
mrn,collected_date,test_code,test_name,value,unit,ref_low,ref_high
```

Supported test codes are:

| Code | Test |
| --- | --- |
| `GLU-F` | Fasting Glucose |
| `HBA1C` | Hemoglobin A1c |
| `SBP` | Systolic Blood Pressure |

Every non-empty row is evaluated independently. A row is rejected with one or
more specific reasons for:

- an incorrect column count or missing required fields;
- an unknown MRN;
- a malformed or future collection date;
- an unknown test code;
- non-numeric or out-of-range decimal values;
- a reference low value greater than its reference high value; or
- a duplicate MRN + collection date + test code, either in the same file or
  already stored.

Valid rows are committed even when other rows fail. Imports and their complete
validation reports are retained for later review. A database unique constraint
and a serializable import transaction protect against duplicates created by
concurrent requests. Uploaded files are limited to 1 MB and the raw file itself
is not retained.

## Assessment lifecycle

1. A clinician sends an assessment from a patient record.
2. PulseTrack generates 32 random bytes, puts the raw token only in the emailed
   URL, and stores its SHA-256 hash.
3. The assessment is saved as `SENT` with an expiry exactly seven days later.
4. If email delivery fails, the pending assessment is removed and the clinician
   receives a clear, bounded error.
5. The public page validates all eight answers and calculates the supplied
   DSMA-8 score and risk band.
6. A serializable transaction changes `SENT` to `COMPLETED` exactly once.
   Expired links are persisted as `EXPIRED`; completed or expired links cannot
   submit again.

Resend requests use the assessment ID as an idempotency key and the returned
provider ID is retained for delivery auditing.

## Architecture and FHIR integration diagram

```mermaid
flowchart LR
    C[Clinician browser]
    P[Patient browser]

    subgraph PT[PulseTrack on Vercel]
        N[Next.js App Router]
        S[Server Components and Server Actions]
        D[Authenticated domain services]
        F[FHIR R4 client and mappers]
        O[Prisma Client and PostgreSQL adapter]
    end

    DB[(PostgreSQL)]
    R[Resend API]
    H[Shared HAPI FHIR R4 server]

    C -->|HTTPS and session cookie| N
    P -->|HTTPS and single-use token| N
    N --> S
    S --> D
    D --> O
    O -->|parameterized queries| DB
    D -->|idempotent email request| R
    R -->|assessment email| P
    D --> F
    F -->|POST or PUT Patient| H
    F -->|POST Observation| H
    H -->|Patient and Observation search Bundles| F
    F -->|validated mapped records| O
```

The Next.js application is the only component that accesses PostgreSQL or
provider credentials. Server Components perform reads and Server Actions
handle mutations; both call clinician-scoped services before using Prisma or
the FHIR client. The public assessment route has no patient login; possession
of the high-entropy, expiring, single-use token is its narrowly scoped
authorization.

## Entity relationship diagram

```mermaid
erDiagram
    CLINICIAN ||--o{ SESSION : has
    CLINICIAN ||--o{ PATIENT : manages
    CLINICIAN ||--o{ LAB_IMPORT : uploads
    PATIENT ||--o{ ASSESSMENT : receives
    PATIENT ||--o{ LAB_RESULT : has
    LAB_IMPORT o|--o{ LAB_RESULT : creates

    CLINICIAN {
        string id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
        datetime updatedAt
    }

    SESSION {
        string id PK
        string clinicianId FK
        string tokenHash UK
        datetime expiresAt
        datetime createdAt
        datetime lastActiveAt
    }

    PATIENT {
        string id PK
        string clinicianId FK
        string fullName
        date dob
        enum sex
        string mrn UK
        string email
        string phone
        string fhirResourceId UK
        enum fhirOwnership
        enum fhirSyncStatus
        datetime fhirLastSyncedAt
        string fhirLastError
        datetime createdAt
        datetime updatedAt
    }

    ASSESSMENT {
        string id PK
        string patientId FK
        string questionnaireId
        string questionnaireVersion
        string tokenHash UK
        enum status
        enum deliveryMode
        string emailProviderId
        datetime sentAt
        datetime expiresAt
        datetime completedAt
        json responses
        int score
        enum riskBand
    }

    LAB_IMPORT {
        string id PK
        string clinicianId FK
        string fileName
        int totalRows
        int acceptedCount
        int rejectedCount
        json report
        datetime createdAt
    }

    LAB_RESULT {
        string id PK
        string patientId FK
        string importId FK
        date collectedDate
        string testCode
        string testName
        decimal value
        string unit
        decimal refLow
        decimal refHigh
        enum source
        string fhirResourceId UK
        enum fhirSyncStatus
        datetime fhirLastSyncedAt
        string fhirLastError
        datetime createdAt
    }
```

The lab-result uniqueness rule is the composite
`(patientId, collectedDate, testCode)`.

## Security notes

- Passwords are hashed with bcrypt. Login performs a dummy bcrypt comparison
  when the email is unknown to reduce account-enumeration timing differences.
- Session and assessment tokens are generated with a cryptographically secure
  random source; only SHA-256 hashes are stored.
- Session cookies are `HttpOnly`, `SameSite=Lax`, scoped to the application,
  expire after 12 hours, and are `Secure` in production.
- Every clinician-facing patient, assessment, lab, import, export, and
  dashboard query is scoped to the authenticated clinician.
- Prisma parameterizes database operations. Multi-record assessment and import
  mutations use serializable transactions where concurrency affects
  correctness.
- Patient input and CSV data are validated on the server. CSV downloads escape
  quotes and neutralize spreadsheet formulas.
- Raw CSV uploads are not stored, filenames are sanitized, provider errors are
  bounded, and sensitive values are not intentionally logged.
- FHIR credentials are read only on the server. Pagination links are restricted
  to the configured HTTPS FHIR origin and path so authentication cannot leak to
  an attacker-controlled host.
- Candidate ownership is checked before remote updates. Shared seed resources
  are stored as read-only, and their MRNs are locked locally and enforced
  during the authenticated database update.
- Secrets remain server-side and environment files are ignored by Git.

This is a challenge application using fabricated data, not a certified medical
device or a production clinical record system.

## Decisions & tradeoffs

### Database-backed sessions

A small hand-rolled session layer keeps the authentication flow easy to audit:
the browser receives a random opaque cookie while the database stores only its
hash. It also allows immediate logout and revocation. For a production clinic,
I would use a mature identity provider or Auth.js and add MFA, password reset,
rate limiting, role-based access, session rotation, and security audit events.

### Server-first Next.js design

Server Components and Server Actions keep database access, authorization, and
secrets out of the client bundle. The tradeoff is tighter coupling to Next.js.
For multiple clients or partner integrations, I would introduce a versioned API
boundary and a dedicated service layer.

### Strict, partially successful CSV imports

The importer rejects ambiguous data instead of guessing, but still imports
independently valid rows. The complete report is persisted so clinicians can
correct and re-upload failures safely. Processing the entire file in memory is
reasonable behind the 1 MB limit; larger production imports should use
streaming parsing, object storage, background jobs, and import progress.

### Explicit email failure instead of a hidden fallback

Production always attempts real delivery. Provider failures are surfaced and
the unsent assessment is removed, avoiding a misleading `SENT` record. Resend's
free testing domain is sufficient for an owned test inbox but cannot send to
arbitrary recipients. With more time, I would verify a dedicated sending
subdomain, add delivery-status webhooks, queue retries with exponential
backoff, and provide a controlled resend action.

### Lazy assessment expiry

Expiry is enforced against the timestamp during every public access and
submission, so an expired token can never be used. `EXPIRED` is persisted when
the public assessment, patient history, or clinic dashboard is read. At larger
scale, a scheduled job would materialize expiry proactively for reporting.

### Synchronous FHIR synchronization

Patient and CSV workflows attempt FHIR synchronization immediately, which
keeps challenge behavior easy to observe and gives clinicians a clear
per-resource status. The transport retries temporary failures, while permanent
failures leave the local record intact with a bounded error instead of losing
clinic work. A production national integration should use an outbox and
background workers with durable retries, dead-letter handling, monitoring, and
an explicit manual retry control.

### Explicit historical import

Historical data is imported with a clinician-triggered action so the data
movement is intentional and its result is visible. The importer fetches and
validates all five remote patient packages before opening a short serializable
database transaction. Re-running it matches resource IDs and clinical
uniqueness keys instead of duplicating data. A larger recurring feed should use
incremental synchronization based on FHIR history or `_lastUpdated` cursors.

### Healthcare lifecycle

Deleting a patient currently cascades to their assessments and lab results,
which keeps this fabricated challenge dataset simple. A real clinical system
would normally use retention policies, soft deletion, immutable audit trails,
consent handling, backups, and an approved data-governance process.

## Deployment

1. Create a PostgreSQL database and run `npx prisma migrate deploy` against its
   production `DATABASE_URL`.
2. Import this repository into Vercel.
3. Add `DATABASE_URL`, `EMAIL_DELIVERY_MODE=resend`, `APP_URL`,
   `RESEND_API_KEY`, `EMAIL_FROM`, `FHIR_BASE_URL`, `FHIR_CANDIDATE_ID`, and
   `FHIR_API_KEY` to the Vercel Production environment.
4. Set `APP_URL` to the final `https://...vercel.app` origin.
5. Keep Vercel's detected `npm run build` build command. The `postinstall`
   script generates Prisma Client during dependency installation.
6. Deploy, run `npm run seed` once against the production database, and verify
   login, email delivery, CSV import, FHIR push/pull, and responsive layouts.

Do not place secrets in `NEXT_PUBLIC_...` variables. Keep the Vercel production
database and email credentials separate from local development credentials.

## Scope

Tier 1 and Tier 2 are implemented. The open-ended Tier 3 AI bonus is not
included; the submission prioritizes a complete, testable clinical workflow
and a carefully bounded external-data integration.
