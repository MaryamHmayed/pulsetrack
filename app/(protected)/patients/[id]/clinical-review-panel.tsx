"use client";

import { useActionState, useEffect, useState } from "react";
import type { ClinicalEvidenceItem } from "@/lib/ai/clinical-evidence";
import type { PatientClinicalReview } from "@/lib/ai/reviews";
import { formatDateTimeUtc } from "@/lib/format/date";
import { Icon } from "@/app/ui/icons";
import {
  generateClinicalReviewAction,
  type ClinicalReviewActionState,
} from "./clinical-review-actions";

const initialState: ClinicalReviewActionState = {};

function Citations({
  evidenceIds,
  onSelect,
}: {
  evidenceIds: string[];
  onSelect: (evidenceId: string) => void;
}) {
  return (
    <span className="ml-1 inline-flex flex-wrap gap-1 align-middle">
      {evidenceIds.map((evidenceId) => (
        <button
          aria-label={`View evidence ${evidenceId}`}
          className="rounded-md border border-teal-200 bg-teal-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-teal-800 transition hover:border-teal-300 hover:bg-teal-100"
          key={evidenceId}
          onClick={() => onSelect(evidenceId)}
          type="button"
        >
          {evidenceId}
        </button>
      ))}
    </span>
  );
}

function evidenceRangeLabel(item: ClinicalEvidenceItem) {
  if (item.kind !== "LAB") {
    return `${item.riskBand.toLowerCase().replace("_", " ")} risk`;
  }

  const labels = {
    LOW: "Below supplied range",
    NORMAL: "Within supplied range",
    HIGH: "Above supplied range",
    UNKNOWN: "No supplied range",
  } as const;

  return labels[item.rangeStatus];
}

const relationshipLabels = {
  ALIGNED: "Aligned signals",
  DIVERGENT: "Divergent signals",
  COMPLEMENTARY: "Complementary signals",
  LIMITED: "Limited comparison",
} as const;

export function ClinicalReviewPanel({
  patientId,
  review,
  hasEvidence,
}: {
  patientId: string;
  review: PatientClinicalReview | null;
  hasEvidence: boolean;
}) {
  const action = generateClinicalReviewAction.bind(null, patientId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );
  const evidence = review ? [...review.evidence].reverse() : [];
  const canGenerate = hasEvidence && (!review || review.isStale);

  useEffect(() => {
    if (!evidenceOpen || !selectedEvidenceId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(`ai-evidence-${selectedEvidenceId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [evidenceOpen, selectedEvidenceId]);

  function selectEvidence(evidenceId: string) {
    setEvidenceOpen(true);
    setSelectedEvidenceId(evidenceId);
  }

  return (
    <section
      className="app-card scroll-mt-28 overflow-hidden"
      id="clinical-review"
    >
      <div className="border-b border-teal-100 bg-[linear-gradient(135deg,#f0fbfb_0%,#f7fbff_55%,#ffffff_100%)] p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2.5 py-1 text-xs font-bold text-teal-800">
                <Icon className="h-3.5 w-3.5" name="sparkles" />
                AI-assisted
              </span>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">
                Evidence required
              </span>
              {review?.isStale ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  New data available
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-xl font-bold text-[#073a5a] sm:text-2xl">
              Evidence-backed clinical review
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Gemini organizes the patient&apos;s recorded labs and completed
              DSMA-8 results. Every generated statement links back to the
              evidence supplied to the model.
            </p>
          </div>

          <form action={formAction} className="shrink-0">
            <button
              className="button-primary inline-flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2.5 sm:w-auto"
              disabled={pending || !canGenerate}
              type="submit"
            >
              <Icon className="h-4 w-4" name="sparkles" />
              {pending
                ? "Reviewing evidence…"
                : review?.isStale
                  ? "Refresh review"
                  : review
                    ? "Review is current"
                    : "Generate review"}
            </button>
          </form>
        </div>

        {state.message ? (
          <p
            aria-live="polite"
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
              state.kind === "SUCCESS"
                ? "border border-teal-200 bg-white text-teal-800"
                : "border border-red-200 bg-red-50 text-red-800"
            }`}
            role={state.kind === "ERROR" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
      </div>

      {!hasEvidence ? (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center">
            <p className="font-semibold text-slate-800">
              Clinical evidence is needed
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Import at least one lab result or complete a DSMA-8 assessment
              before generating an AI-assisted review.
            </p>
          </div>
        </div>
      ) : review ? (
        <div className="space-y-6 p-5 sm:p-6">
          {review.isStale ? (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
              role="status"
            >
              This saved review predates the latest clinical data. Its
              citations remain tied to the original evidence; generate a fresh
              review before relying on it for the current record.
            </div>
          ) : null}

          <article className="rounded-2xl border border-[#ccebed] bg-[#f3fbfb] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
              Clinical summary
            </p>
            <p className="mt-3 text-base leading-7 text-slate-800">
              {review.review.summary.text}
              <Citations
                evidenceIds={review.review.summary.evidenceIds}
                onSelect={selectEvidence}
              />
            </p>
          </article>

          {review.review.combinedPerspective[0] ? (
            <article className="relative overflow-hidden rounded-2xl border border-[#b8dce8] bg-[linear-gradient(135deg,#073a5a_0%,#07516b_58%,#087b83_100%)] p-5 text-white shadow-[0_14px_30px_rgba(7,58,90,0.16)]">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-10 h-32 w-32 rounded-full border border-white/15"
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/12 text-cyan-100">
                    <Icon className="h-4 w-4" name="sparkles" />
                  </span>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Combined perspective
                  </p>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    {
                      relationshipLabels[
                        review.review.combinedPerspective[0].relationship
                      ]
                    }
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {review.review.combinedPerspective[0].headline}
                </h3>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-white/90 sm:text-base">
                  {review.review.combinedPerspective[0].text}
                </p>
                <div className="mt-4 rounded-xl border border-white/15 bg-black/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">
                    Why this matters
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/90">
                    {review.review.combinedPerspective[0].clinicalRelevance}
                    <Citations
                      evidenceIds={
                        review.review.combinedPerspective[0].evidenceIds
                      }
                      onSelect={selectEvidence}
                    />
                  </p>
                </div>
                <p className="mt-3 text-xs leading-5 text-cyan-100/80">
                  Relationship classification supports review; it does not
                  establish causation.
                </p>
              </div>
            </article>
          ) : null}

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Areas to review
            </h3>
            {review.review.attentionAreas.length > 0 ? (
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {review.review.attentionAreas.map((item, index) => (
                  <article
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,50,70,0.05)]"
                    key={`${item.title}-${index}`}
                  >
                    <h4 className="font-bold text-[#073a5a]">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.text}
                      <Citations
                        evidenceIds={item.evidenceIds}
                        onSelect={selectEvidence}
                      />
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                The model did not identify a distinct evidence-backed area to
                review.
              </p>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              Questions for the next review
            </h3>
            {review.review.followUpQuestions.length > 0 ? (
              <ol className="mt-3 grid gap-3 lg:grid-cols-2">
                {review.review.followUpQuestions.map((item, index) => (
                  <li
                    className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={`${item.text}-${index}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#073a5a] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-700">
                      {item.text}
                      <Citations
                        evidenceIds={item.evidenceIds}
                        onSelect={selectEvidence}
                      />
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                No additional evidence-backed questions were generated.
              </p>
            )}
          </div>

          <details
            className="group rounded-xl border border-slate-200 bg-white"
            onToggle={(event) => setEvidenceOpen(event.currentTarget.open)}
            open={evidenceOpen}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-bold text-slate-800">
              Evidence used ({evidence.length})
              <span className="text-lg text-teal-700 transition group-open:rotate-45">
                +
              </span>
            </summary>
            <ul className="divide-y divide-slate-100 border-t border-slate-200">
              {evidence.map((item) => (
                <li
                  className={`scroll-mt-28 p-4 transition ${
                    selectedEvidenceId === item.id
                      ? "bg-teal-50 ring-2 ring-inset ring-teal-200"
                      : ""
                  }`}
                  id={`ai-evidence-${item.id}`}
                  key={item.id}
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-700">
                          {item.id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.date}
                        </span>
                      </div>
                      <p className="mt-1 font-semibold text-slate-900">
                        {item.label}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-bold text-[#073a5a]">{item.value}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {evidenceRangeLabel(item)}
                      </p>
                    </div>
                  </div>
                  {item.kind === "LAB" ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {item.source}
                      {item.referenceRange
                        ? ` · Reference ${item.referenceRange}`
                        : ""}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </details>

          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500 sm:flex-row">
            <p>
              Generated {formatDateTimeUtc(new Date(review.generatedAt))} ·
              Data through {review.dataThrough} · {review.model}
            </p>
            <p className="max-w-xl sm:text-right">
              AI-assisted review, not a diagnosis or treatment recommendation.
              Verify every statement against the cited source data.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 px-5 py-10 text-center">
            <p className="font-semibold text-[#073a5a]">
              Ready to review the evidence
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Generate an on-demand review to summarize recorded changes,
              identify evidence-backed areas for discussion, and prepare
              follow-up questions.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
