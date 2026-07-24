"use client";

import { useEffect } from "react";
import { markAssessmentExpiredAction } from "./actions";

export function ExpiredMarker({ token }: { token: string }) {
  useEffect(() => {
    void markAssessmentExpiredAction(token);
  }, [token]);

  return null;
}
