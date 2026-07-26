export type FhirResource = {
  resourceType: string;
  id?: string;
  meta?: {
    tag?: FhirCoding[];
  };
};

export type FhirOperationOutcome = FhirResource & {
  resourceType: "OperationOutcome";
  issue?: Array<{
    severity?: string;
    code?: string;
    details?: {
      text?: string;
    };
    diagnostics?: string;
  }>;
};

export type FhirBundle<TResource extends FhirResource = FhirResource> =
  FhirResource & {
    resourceType: "Bundle";
    type?: string;
    total?: number;
    link?: Array<{
      relation?: string;
      url?: string;
    }>;
    entry?: Array<{
      fullUrl?: string;
      resource?: TResource;
    }>;
  };

export type FhirWriteResponse<TResource extends FhirResource> = {
  resource: TResource;
  status: number;
  location: string | null;
};

export type FhirIdentifier = {
  system?: string;
  value?: string;
};

export type FhirHumanName = {
  use?: string;
  text?: string;
  family?: string;
  given?: string[];
};

export type FhirContactPoint = {
  system?: "phone" | "fax" | "email" | "pager" | "url" | "sms" | "other";
  value?: string;
  use?: "home" | "work" | "temp" | "old" | "mobile";
};

export type FhirCoding = {
  system?: string;
  code?: string;
  display?: string;
};

export type FhirCodeableConcept = {
  coding?: FhirCoding[];
  text?: string;
};

export type FhirQuantity = {
  value?: number;
  comparator?: "<" | "<=" | ">=" | ">";
  unit?: string;
  system?: string;
  code?: string;
};

export type FhirPatient = FhirResource & {
  resourceType: "Patient";
  active?: boolean;
  identifier?: FhirIdentifier[];
  name?: FhirHumanName[];
  telecom?: FhirContactPoint[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
};

export type FhirObservation = FhirResource & {
  resourceType: "Observation";
  identifier?: FhirIdentifier[];
  status?:
    | "registered"
    | "preliminary"
    | "final"
    | "amended"
    | "corrected"
    | "cancelled"
    | "entered-in-error"
    | "unknown";
  code?: FhirCodeableConcept;
  subject?: {
    reference?: string;
    display?: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: FhirQuantity;
  referenceRange?: Array<{
    low?: FhirQuantity;
    high?: FhirQuantity;
    text?: string;
  }>;
};
