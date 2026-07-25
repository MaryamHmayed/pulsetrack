# PulseTrack

PulseTrack is a responsive remote patient monitoring platform for a diabetes
clinic. Clinicians can manage patients, email the DSMA-8 self-assessment,
import lab results from CSV, and monitor clinical activity through clinic and
patient dashboards.

This repository contains the completed **Tier 1** scope of the Capadev
Software Engineer Challenge.

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
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by Prisma |
| `EMAIL_DELIVERY_MODE` | `resend` for real delivery; `preview` is available only for explicit local testing |
| `APP_URL` | Origin placed in assessment links; must be the deployed HTTPS URL in production |
| `RESEND_API_KEY` | Server-only Resend credential |
| `EMAIL_FROM` | Sender accepted by Resend |

`onboarding@resend.dev` is Resend's testing sender and can deliver only to the
email address associated with the Resend account. To test with it, update a
fabricated patient's email in PulseTrack to that address. A verified sender
domain is required to deliver to arbitrary recipients.

Never commit `.env` or expose `RESEND_API_KEY` to browser code.

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
restrictions, and bounded provider errors.

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

## Architecture

```mermaid
flowchart LR
    C[Clinician browser]
    P[Patient browser]
    N[Next.js App Router]
    S[Server Components and Server Actions]
    D[Authentication and domain services]
    O[Prisma Client with PostgreSQL adapter]
    DB[(PostgreSQL)]
    R[Resend API]

    C -->|HTTPS, session cookie| N
    P -->|HTTPS, single-use token| N
    N --> S
    S --> D
    D --> O
    O --> DB
    D -->|HTTPS, idempotent request| R
    R -->|Assessment email| P
```

The Next.js application is the only component that accesses PostgreSQL or
provider credentials. Server Components perform reads, Server Actions handle
mutations, and both call clinician-scoped data functions before using Prisma.
The public assessment route has no patient login; possession of the
high-entropy, expiring, single-use token is its narrowly scoped authorization.

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
   `RESEND_API_KEY`, and `EMAIL_FROM` to the Vercel Production environment.
4. Set `APP_URL` to the final `https://...vercel.app` origin.
5. Keep Vercel's detected `npm run build` build command. The `postinstall`
   script generates Prisma Client during dependency installation.
6. Deploy, run `npm run seed` once against the production database, and verify
   login, email delivery, CSV import, and responsive layouts.

Do not place secrets in `NEXT_PUBLIC_...` variables. Keep the Vercel production
database and email credentials separate from local development credentials.

## Scope

Tier 2 FHIR synchronization and the Tier 3 AI bonus are intentionally not
included in this branch. The focus is a complete, polished, and explainable
Tier 1 implementation.
