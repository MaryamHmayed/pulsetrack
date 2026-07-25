import assert from "node:assert/strict";
import test from "node:test";
import {
  createFhirTransport,
  FhirRequestError,
} from "@/lib/fhir/transport";
import type { FhirResource } from "@/lib/fhir/types";

const baseUrl = "https://fhir.example.test/fhir";

test("authenticates FHIR requests and sends FHIR JSON headers", async () => {
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  const transport = createFhirTransport({
    baseUrl,
    apiKey: "private-api-key",
    fetchImplementation: async (input, init) => {
      requests.push({ url: input.toString(), init });
      return Response.json({
        resourceType: "Patient",
        id: "patient-1",
      });
    },
  });

  await transport.create(
    "Patient",
    { resourceType: "Patient" },
    "identifier=system|MRN-1001",
  );

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, `${baseUrl}/Patient`);
  assert.equal(requests[0]?.init?.method, "POST");
  const headers = new Headers(requests[0]?.init?.headers);
  assert.equal(headers.get("Accept"), "application/fhir+json");
  assert.equal(headers.get("Content-Type"), "application/fhir+json");
  assert.equal(headers.get("X-API-Key"), "private-api-key");
  assert.equal(
    headers.get("If-None-Exist"),
    "identifier=system|MRN-1001",
  );
});

test("retries a rate-limited request using Retry-After", async () => {
  let requestCount = 0;
  const delays: number[] = [];
  const transport = createFhirTransport({
    baseUrl,
    apiKey: "private-api-key",
    sleep: async (milliseconds) => {
      delays.push(milliseconds);
    },
    fetchImplementation: async () => {
      requestCount += 1;

      if (requestCount === 1) {
        return Response.json(
          {
            resourceType: "OperationOutcome",
            issue: [{ diagnostics: "Rate limit exceeded." }],
          },
          {
            status: 429,
            headers: { "Retry-After": "2" },
          },
        );
      }

      return Response.json({
        resourceType: "Bundle",
        type: "searchset",
      });
    },
  });

  const bundle = await transport.get<{ resourceType: string }>("Patient");

  assert.equal(bundle.resourceType, "Bundle");
  assert.equal(requestCount, 2);
  assert.deepEqual(delays, [2_000]);
});

test("surfaces bounded OperationOutcome diagnostics without credentials", async () => {
  const apiKey = "private-api-key-that-must-not-leak";
  const transport = createFhirTransport({
    baseUrl,
    apiKey,
    maxAttempts: 1,
    fetchImplementation: async () =>
      Response.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              diagnostics: `The resource is read-only. ${"x".repeat(700)}`,
            },
          ],
        },
        { status: 403 },
      ),
  });

  await assert.rejects(
    () => transport.get("Patient/read-only"),
    (error: unknown) => {
      assert.ok(error instanceof FhirRequestError);
      assert.equal(error.status, 403);
      assert.equal(error.retryable, false);
      assert.ok(error.message.includes("The resource is read-only."));
      assert.ok(error.message.length < 550);
      assert.ok(!error.message.includes(apiKey));
      return true;
    },
  );
});

test("follows Bundle next links without leaking auth to another origin", async () => {
  const requestedUrls: string[] = [];
  const transport = createFhirTransport({
    baseUrl,
    apiKey: "private-api-key",
    fetchImplementation: async (input) => {
      const url = input.toString();
      requestedUrls.push(url);

      if (requestedUrls.length === 1) {
        return Response.json({
          resourceType: "Bundle",
          type: "searchset",
          entry: [
            { resource: { resourceType: "Patient", id: "patient-1" } },
          ],
          link: [
            {
              relation: "next",
              url: `${baseUrl}/Patient?_page=2`,
            },
          ],
        });
      }

      return Response.json({
        resourceType: "Bundle",
        type: "searchset",
        entry: [
          { resource: { resourceType: "Patient", id: "patient-2" } },
        ],
      });
    },
  });

  const resources = await transport.searchAll<FhirResource>("Patient");

  assert.deepEqual(
    resources.map((resource) => resource.id),
    ["patient-1", "patient-2"],
  );
  assert.deepEqual(requestedUrls, [
    `${baseUrl}/Patient`,
    `${baseUrl}/Patient?_page=2`,
  ]);

  const unsafeTransport = createFhirTransport({
    baseUrl,
    apiKey: "private-api-key",
    fetchImplementation: async () =>
      Response.json({
        resourceType: "Bundle",
        type: "searchset",
        link: [
          {
            relation: "next",
            url: "https://attacker.example/steal",
          },
        ],
      }),
  });

  await assert.rejects(
    () => unsafeTransport.searchAll("Patient"),
    /unsafe pagination URL/,
  );
});
