import type {
  FhirBundle,
  FhirOperationOutcome,
  FhirResource,
  FhirWriteResponse,
} from "@/lib/fhir/types";

const FHIR_JSON = "application/fhir+json";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_DIAGNOSTIC_LENGTH = 500;
const MAX_PAGES = 100;
const MAX_RETRY_DELAY_MS = 30_000;

type FetchImplementation = typeof fetch;
type SleepImplementation = (milliseconds: number) => Promise<void>;

type FhirTransportOptions = {
  baseUrl: string;
  apiKey: string;
  fetchImplementation?: FetchImplementation;
  sleep?: SleepImplementation;
  timeoutMs?: number;
  maxAttempts?: number;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: FhirResource;
  ifNoneExist?: string;
};

type JsonResponse<T> = {
  body: T;
  status: number;
  location: string | null;
};

export class FhirRequestError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    options: {
      status?: number | null;
      retryable?: boolean;
    } = {},
  ) {
    super(message);
    this.name = "FhirRequestError";
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function operationOutcomeDiagnostics(payload: unknown) {
  if (
    !isRecord(payload) ||
    payload.resourceType !== "OperationOutcome" ||
    !Array.isArray(payload.issue)
  ) {
    return null;
  }

  const outcome = payload as FhirOperationOutcome;
  const diagnostics = (outcome.issue ?? [])
    .map((issue) => issue.diagnostics?.trim() || issue.details?.text?.trim())
    .filter((message): message is string => Boolean(message))
    .join(" ");

  return diagnostics
    ? diagnostics.slice(0, MAX_DIAGNOSTIC_LENGTH)
    : null;
}

function retryDelayMilliseconds(
  retryAfter: string | null,
  attempt: number,
  now = Date.now(),
) {
  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1_000, MAX_RETRY_DELAY_MS);
    }

    const retryDate = Date.parse(retryAfter);
    if (Number.isFinite(retryDate)) {
      return Math.min(
        Math.max(0, retryDate - now),
        MAX_RETRY_DELAY_MS,
      );
    }
  }

  return Math.min(250 * 2 ** (attempt - 1), 2_000);
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveFhirUrl(baseUrl: string, target: string) {
  const base = new URL(`${normalizeBaseUrl(baseUrl)}/`);
  const resolved = new URL(target.replace(/^\/+/, ""), base);
  const basePath = base.pathname.replace(/\/+$/, "");

  if (
    resolved.protocol !== "https:" ||
    resolved.origin !== base.origin ||
    (resolved.pathname !== basePath &&
      !resolved.pathname.startsWith(`${basePath}/`))
  ) {
    throw new FhirRequestError(
      "The FHIR server returned an unsafe pagination URL.",
    );
  }

  return resolved;
}

export function createFhirTransport(options: FhirTransportOptions) {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw new Error("maxAttempts must be an integer between 1 and 5.");
  }

  async function request<T>(
    target: string,
    requestOptions: RequestOptions = {},
  ): Promise<JsonResponse<T>> {
    const url = resolveFhirUrl(baseUrl, target);
    const method = requestOptions.method ?? "GET";

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let response: Response;

      try {
        response = await fetchImplementation(url, {
          method,
          headers: {
            Accept: FHIR_JSON,
            "X-API-Key": options.apiKey,
            ...(requestOptions.body
              ? { "Content-Type": FHIR_JSON }
              : {}),
            ...(requestOptions.ifNoneExist
              ? { "If-None-Exist": requestOptions.ifNoneExist }
              : {}),
          },
          body: requestOptions.body
            ? JSON.stringify(requestOptions.body)
            : undefined,
          cache: "no-store",
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        if (attempt < maxAttempts) {
          await sleep(retryDelayMilliseconds(null, attempt));
          continue;
        }

        throw new FhirRequestError(
          "The FHIR server could not be reached. Please try again.",
          { retryable: true },
        );
      }

      const payload = await readJson(response);

      if (response.ok) {
        if (!isRecord(payload)) {
          throw new FhirRequestError(
            "The FHIR server returned an invalid JSON response.",
            { status: response.status },
          );
        }

        return {
          body: payload as T,
          status: response.status,
          location: response.headers.get("Location"),
        };
      }

      const retryable = isRetryableStatus(response.status);

      if (retryable && attempt < maxAttempts) {
        await sleep(
          retryDelayMilliseconds(response.headers.get("Retry-After"), attempt),
        );
        continue;
      }

      const diagnostics = operationOutcomeDiagnostics(payload);
      const suffix = diagnostics ? ` ${diagnostics}` : "";

      throw new FhirRequestError(
        `FHIR request failed (${response.status}).${suffix}`,
        {
          status: response.status,
          retryable,
        },
      );
    }

    throw new FhirRequestError("FHIR request failed unexpectedly.");
  }

  async function get<T>(target: string) {
    return (await request<T>(target)).body;
  }

  async function create<TResource extends FhirResource>(
    resourceType: string,
    resource: TResource,
    ifNoneExist?: string,
  ): Promise<FhirWriteResponse<TResource>> {
    const response = await request<TResource>(resourceType, {
      method: "POST",
      body: resource,
      ifNoneExist,
    });

    return {
      resource: response.body,
      status: response.status,
      location: response.location,
    };
  }

  async function update<TResource extends FhirResource>(
    resourceType: string,
    id: string,
    resource: TResource,
  ): Promise<FhirWriteResponse<TResource>> {
    const response = await request<TResource>(
      `${encodeURIComponent(resourceType)}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: resource,
      },
    );

    return {
      resource: response.body,
      status: response.status,
      location: response.location,
    };
  }

  async function searchAll<TResource extends FhirResource>(target: string) {
    const resources: TResource[] = [];
    const visited = new Set<string>();
    let next: string | null = target;

    for (let page = 0; next && page < MAX_PAGES; page += 1) {
      const resolved = resolveFhirUrl(baseUrl, next).toString();

      if (visited.has(resolved)) {
        throw new FhirRequestError(
          "The FHIR server returned a pagination loop.",
        );
      }

      visited.add(resolved);
      const bundle: FhirBundle<TResource> = await get(resolved);

      if (bundle.resourceType !== "Bundle") {
        throw new FhirRequestError(
          "The FHIR search response was not a Bundle.",
        );
      }

      for (const entry of bundle.entry ?? []) {
        if (entry.resource) {
          resources.push(entry.resource);
        }
      }

      next =
        bundle.link?.find((link) => link.relation === "next")?.url ?? null;
    }

    if (next) {
      throw new FhirRequestError(
        "The FHIR search exceeded the pagination safety limit.",
      );
    }

    return resources;
  }

  return {
    get,
    create,
    update,
    searchAll,
  };
}

export type FhirTransport = ReturnType<typeof createFhirTransport>;
