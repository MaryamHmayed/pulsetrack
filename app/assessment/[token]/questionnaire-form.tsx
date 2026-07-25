"use client";

import { useActionState } from "react";
import { dsma8 } from "@/lib/questionnaire/dsma8";
import {
  submitAssessmentAction,
  type AssessmentFormState,
} from "./actions";

const initialState: AssessmentFormState = {};

function TerminalState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="app-card p-8 text-center">
      <h1 className="text-2xl font-bold text-[#073a5a]">{title}</h1>
      <p className="mt-3 leading-7 text-slate-600">{message}</p>
      <p className="mt-4 text-sm text-slate-500">
        You may close this window. Contact your clinic if you need assistance.
      </p>
    </div>
  );
}

export function QuestionnaireForm({ token }: { token: string }) {
  const action = submitAssessmentAction.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);
  const invalidItems = new Set(state.invalidItemIds ?? []);

  if (state.kind === "SUCCESS") {
    return (
      <TerminalState
        message="Your responses have been securely recorded and are available to your care team."
        title="Thank you"
      />
    );
  }

  if (state.kind === "COMPLETED") {
    return (
      <TerminalState
        message="This link was already submitted. Your previous responses have not been changed."
        title="Assessment already completed"
      />
    );
  }

  if (state.kind === "EXPIRED") {
    return (
      <TerminalState
        message="Assessment links are valid for seven days. Ask your clinic to send a new one."
        title="Link expired"
      />
    );
  }

  if (state.kind === "INVALID") {
    return (
      <TerminalState
        message="This assessment link cannot be verified."
        title="Invalid link"
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      {dsma8.items.map((item, index) => (
        <fieldset
          aria-describedby={
            invalidItems.has(item.id) ? `${item.id}-error` : undefined
          }
          aria-invalid={invalidItems.has(item.id)}
          className={`app-card min-w-0 p-5 sm:p-6 ${
            invalidItems.has(item.id) ? "is-invalid" : ""
          }`}
          key={item.id}
        >
          <legend className="sr-only">
            Question {index + 1}: {item.text}
          </legend>
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e2f6f7] text-sm font-bold text-[#087f8a]"
            >
              {index + 1}
            </span>
            <p className="min-w-0 flex-1 text-base font-semibold leading-7 text-slate-900">
              {item.text}
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {dsma8.options.map((option) => {
              const inputId = `${item.id}-${option.value}`;

              return (
                <label
                  className="flex min-h-12 min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm transition hover:border-teal-400 hover:bg-teal-50 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-semibold"
                  htmlFor={inputId}
                  key={option.value}
                >
                  <input
                    defaultChecked={
                      state.values?.[item.id] === String(option.value)
                    }
                    id={inputId}
                    name={item.id}
                    required
                    className="h-4 w-4 shrink-0 accent-teal-700"
                    type="radio"
                    value={option.value}
                  />
                  <span className="min-w-0 leading-5">{option.label}</span>
                </label>
              );
            })}
          </div>
          {invalidItems.has(item.id) ? (
            <p
              className="mt-3 text-sm text-red-700"
              id={`${item.id}-error`}
            >
              Select one answer for this question.
            </p>
          ) : null}
        </fieldset>
      ))}

      <div className="app-card sticky bottom-3 p-5">
        <p className="text-sm leading-6 text-slate-600">
          Submit only when all eight questions are answered. This secure link
          can be used once.
        </p>
        <button
          className="button-primary mt-4 w-full"
          disabled={pending}
          type="submit"
        >
          {pending ? "Submitting…" : "Submit assessment"}
        </button>
      </div>
    </form>
  );
}
