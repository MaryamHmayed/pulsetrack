export type FhirResource = {
  resourceType: string;
  id?: string;
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
