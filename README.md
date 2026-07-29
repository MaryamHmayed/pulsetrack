# PulseTrack

PulseTrack is a responsive remote patient monitoring platform for a diabetes
clinic. Clinicians can manage patients, email the DSMA-8 self-assessment,
import lab results from CSV, and monitor clinical activity through clinic and
patient dashboards.

This repository contains the completed **Tier 1, Tier 2, and Tier 3** scope of
the Capadev Software Engineer Challenge.

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
| Historical pull | An idempotent administrative command imports the five supplied MRNs and their 180 historical observations into the existing patient dashboards |
| Idempotency | Conditional creates, stored FHIR resource IDs, database uniqueness constraints, and import matching prevent duplicate patients and observations |
| External API handling | Server-only API-key authentication, ten-second request timeouts, bounded retries, `Retry-After` support, safe pagination, validated FHIR responses, and visible per-resource failure states |
| Shared-server isolation | Candidate-owned resources may be updated; imported seed resources are marked read-only and never written back |

## Tier 3 AI coverage

| Requirement | Implementation |
| --- | --- |
| Useful clinical feature | An on-demand evidence-backed review summarizes recorded changes, connects lab and DSMA-8 patterns when both exist, identifies areas for clinician review, and suggests follow-up questions |
| Grounding | The model receives a bounded anonymous snapshot of application-computed lab trends, supplied reference ranges, and completed DSMA-8 scores |
| Citation enforcement | Every generated statement must cite one or more exact evidence IDs; unknown or missing citations reject the complete response |
| Cross-domain synthesis | When both domains exist, the model must classify their relationship as aligned, divergent, complementary, or limited; explain its clinical relevance; and cite at least one result from each domain |
| Hallucination controls | Gemini is prohibited from diagnosing, prescribing, inferring causes, or introducing external thresholds; malformed, truncated, blocked, or oversized output is rejected |
| Privacy minimization | Names, MRNs, contact details, database IDs, FHIR IDs, and raw questionnaire tokens are never sent to Gemini |
| Auditability | Validated reviews retain the model, generation time, data-through date, anonymous evidence, output, and an input fingerprint |
| Freshness and cost control | Reviews are reused for identical evidence, visibly marked stale after relevant data changes, and limited to five new saved reviews per clinician per hour |

## Technology

- Next.js 16 App Router and React 19
- TypeScript
- PostgreSQL
- Prisma ORM 7 with the PostgreSQL driver adapter
- Tailwind CSS 4
- Resend transactional email API
- Google Gemini 3.1 Flash-Lite through the server-side REST API
- Node.js built-in test runner

## Local setup

### Prerequisites

- Node.js 22 or newer
- npm
- A PostgreSQL database
- A Resend account and API key for real email delivery
- A free-tier Gemini API key from Google AI Studio for Tier 3

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
GEMINI_API_KEY="your-google-ai-studio-key"
GEMINI_MODEL="gemini-3.1-flash-lite"
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
| `GEMINI_API_KEY` | Server-only Google AI Studio credential |
| `GEMINI_MODEL` | Gemini model used for saved clinical reviews; defaults to `gemini-3.1-flash-lite` |

`onboarding@resend.dev` is Resend's testing sender and can deliver only to the
email address associated with the Resend account. To test with it, update a
fabricated patient's email in PulseTrack to that address. A verified sender
domain is required to deliver to arbitrary recipients.

Never commit `.env` or expose `RESEND_API_KEY` or `FHIR_API_KEY` to browser
code. `GEMINI_API_KEY` must remain server-only as well.

Gemini's free tier may use submitted content to improve Google's products.
PulseTrack therefore sends only minimized, de-identified snapshots and this
challenge must contain fabricated data only. A real healthcare deployment
would require an approved provider agreement, privacy and security review,
regional controls, retention guarantees, and confirmation that submitted
clinical data is not used for provider training.

### 3. Prepare the database and start the app

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run fhir:import-history -- test@pulsetrack.dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the test
clinician above.

The seed is idempotent: it upserts the test clinician and three fabricated
patients instead of creating duplicates. The FHIR history command is also
idempotent and requires the target clinician email explicitly; repeat runs
match existing remote IDs and clinical keys rather than creating duplicates.

Confirm the configured FHIR connection before testing synchronization:

```bash
npm run fhir:check
```

Confirm the configured Gemini model with a fabricated evidence snapshot before
using a patient record:

```bash
npm run ai:check
```

The command prints only the model name and validated citation counts; it does
not read or print patient data.

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
idempotency helpers, bounded provider errors, anonymous AI evidence snapshots,
input fingerprinting, structured Gemini responses, and citation validation.

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
12. Confirm the five FHIR-history patients and their 180 read-only
    observations appear alongside local records in patient and clinic
    dashboards. Run the administrative import command again and confirm its
    summary reports that existing records were skipped.
13. On a patient with labs or a completed assessment, generate an
    **Evidence-backed clinical review**. Open its evidence list and select each
    citation badge to verify that it focuses the supporting value.
    When both labs and completed assessments exist, confirm the **Combined
    perspective** cites at least one `LAB-*` and one `ASM-*` item.
14. Add a new lab result and return to the patient. Confirm the saved review is
    marked **New data available**, then refresh it.

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
    G[Google Gemini API]

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
    D -->|bounded de-identified evidence snapshot| G
    G -->|schema-constrained cited review| D
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
    CLINICIAN ||--o{ CLINICAL_REVIEW : generates
    PATIENT ||--o{ ASSESSMENT : receives
    PATIENT ||--o{ LAB_RESULT : has
    PATIENT ||--o{ CLINICAL_REVIEW : has
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

    CLINICAL_REVIEW {
        string id PK
        string patientId FK
        string clinicianId FK
        string inputHash
        string model
        json evidence
        json review
        date dataThrough
        datetime generatedAt
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
- Gemini is invoked only from an authenticated, clinician-scoped server
  service. Direct identifiers are removed before the request, request size is
  bounded, output follows a strict schema, and every citation is checked
  against the exact supplied evidence before persistence.
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

### Administrative historical import

Historical data is provisioned with an explicit administrative command instead
of a routine clinician-facing control. The command requires a clinician email,
then fetches and validates all five remote patient packages before opening a
short serializable database transaction. Re-running it matches resource IDs and
clinical uniqueness keys instead of duplicating data. A larger recurring feed
should run as a monitored background job using incremental synchronization
based on FHIR history or `_lastUpdated` cursors.

### Evidence-backed AI instead of autonomous advice

The AI feature is intentionally a review aid rather than a diagnosis engine or
open-ended patient chat. PulseTrack calculates numeric trends and assessment
scores itself, removes direct identifiers, and asks Gemini only to organize the
bounded evidence. Structured output improves reliability, but is not treated
as proof of factual correctness: the server validates every evidence ID and
the UI keeps supporting values one click away. Reviews are persisted with an
input fingerprint so clinicians can see when newer data makes a review stale.
When both clinical domains are present, the response contract requires one
combined perspective that classifies and explains the relationship between the
objective lab trajectory and reported self-management risk. It must cite lab
and assessment evidence while expressly forbidding causal language.

The tradeoff is that evidence citations cannot prove that the model interpreted
the cited value correctly. The clinician remains responsible for verification,
and the UI explicitly avoids presenting the output as a diagnosis or treatment
recommendation. A production clinical deployment would additionally require
formal model evaluation, prompt/version governance, audit events, adverse-event
monitoring, human-factors testing, and a healthcare-approved provider contract.

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
   `FHIR_API_KEY`, `GEMINI_API_KEY`, and `GEMINI_MODEL` to the Vercel
   Production environment.
4. Set `APP_URL` to the final `https://...vercel.app` origin.
5. Keep Vercel's detected `npm run build` build command. The `postinstall`
   script generates Prisma Client during dependency installation.
6. Deploy and run `npm run seed` once against the production database.
7. Run `npm run fhir:import-history -- test@pulsetrack.dev` against that same
   production configuration.
8. Verify login, email delivery, CSV import, FHIR push/pull, AI generation and
   citations, and responsive layouts.

Do not place secrets in `NEXT_PUBLIC_...` variables. Keep the Vercel production
database and email credentials separate from local development credentials.

## Scope

Tier 1, Tier 2, and the evidence-backed Tier 3 AI bonus are implemented. The
submission prioritizes a complete, testable clinical workflow, carefully
bounded external integrations, and human-verifiable AI output.
