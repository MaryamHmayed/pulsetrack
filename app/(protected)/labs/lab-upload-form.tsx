"use client";

import { useActionState } from "react";
import {
  uploadLabCsvAction,
  type LabUploadState,
} from "./actions";

const initialState: LabUploadState = {};

export function LabUploadForm() {
  const [state, formAction, pending] = useActionState(
    uploadLabCsvAction,
    initialState,
  );

  return (
    <div className="space-y-8">
      <form
        action={formAction}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-semibold" htmlFor="labFile">
          Lab results CSV
        </label>
        <p className="mt-1 text-sm leading-6 text-slate-600" id="lab-file-help">
          Select one CSV file using the fixed template. Maximum size: 1 MB.
        </p>
        <input
          accept=".csv,text/csv"
          aria-describedby="lab-file-help"
          className="mt-4 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          disabled={pending}
          id="labFile"
          name="labFile"
          required
          type="file"
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            Valid rows are imported even when other rows are rejected.
          </p>
          <button
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending ? "Validating and importingâ€¦" : "Upload and validate"}
          </button>
        </div>
      </form>

      {state.message ? (
        <div
          aria-live="polite"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}
    </div>
  );
}
