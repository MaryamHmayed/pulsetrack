"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  SEX_OPTIONS,
  type PatientFormState,
  type PatientFormValues,
} from "@/lib/validation/patient";

type PatientFormProps = {
  action: (
    state: PatientFormState,
    formData: FormData,
  ) => Promise<PatientFormState>;
  initialValues?: PatientFormValues;
  submitLabel: string;
  cancelHref: string;
};

const emptyValues: PatientFormValues = {
  fullName: "",
  dob: "",
  sex: "",
  mrn: "",
  email: "",
  phone: "",
};

function FieldError({
  errors,
  id,
}: {
  errors?: string[];
  id: string;
}) {
  if (!errors?.length) {
    return null;
  }

  return (
    <div aria-live="polite" className="mt-2 text-sm text-red-700" id={id}>
      {errors.map((error) => (
        <p key={error}>{error}</p>
      ))}
    </div>
  );
}

export function PatientForm({
  action,
  initialValues = emptyValues,
  submitLabel,
  cancelHref,
}: PatientFormProps) {
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
  });
  const values = state.values ?? initialValues;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium" htmlFor="fullName">
            Full name
          </label>
          <input
            aria-describedby={
              state.errors?.fullName ? "fullName-error" : undefined
            }
            aria-invalid={Boolean(state.errors?.fullName)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.fullName}
            id="fullName"
            maxLength={100}
            name="fullName"
            required
          />
          <FieldError errors={state.errors?.fullName} id="fullName-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="dob">
            Date of birth
          </label>
          <input
            aria-describedby={state.errors?.dob ? "dob-error" : undefined}
            aria-invalid={Boolean(state.errors?.dob)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.dob}
            id="dob"
            name="dob"
            required
            type="date"
          />
          <FieldError errors={state.errors?.dob} id="dob-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="sex">
            Sex
          </label>
          <select
            aria-describedby={state.errors?.sex ? "sex-error" : undefined}
            aria-invalid={Boolean(state.errors?.sex)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.sex}
            id="sex"
            name="sex"
            required
          >
            <option disabled value="">
              Select a value
            </option>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError errors={state.errors?.sex} id="sex-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="mrn">
            Medical record number
          </label>
          <input
            aria-describedby={state.errors?.mrn ? "mrn-error" : "mrn-help"}
            aria-invalid={Boolean(state.errors?.mrn)}
            autoCapitalize="characters"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono uppercase outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.mrn}
            id="mrn"
            maxLength={32}
            name="mrn"
            required
          />
          <p className="mt-2 text-xs text-slate-500" id="mrn-help">
            Uppercase letters, numbers, and hyphens only.
          </p>
          <FieldError errors={state.errors?.mrn} id="mrn-error" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor="phone">
            Phone
          </label>
          <input
            aria-describedby={state.errors?.phone ? "phone-error" : undefined}
            aria-invalid={Boolean(state.errors?.phone)}
            autoComplete="tel"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.phone}
            id="phone"
            maxLength={20}
            name="phone"
            required
            type="tel"
          />
          <FieldError errors={state.errors?.phone} id="phone-error" />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium" htmlFor="email">
            Email address
          </label>
          <input
            aria-describedby={state.errors?.email ? "email-error" : undefined}
            aria-invalid={Boolean(state.errors?.email)}
            autoComplete="email"
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            defaultValue={values.email}
            id="email"
            maxLength={254}
            name="email"
            required
            type="email"
          />
          <FieldError errors={state.errors?.email} id="email-error" />
        </div>
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <Link
          className="rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href={cancelHref}
        >
          Cancel
        </Link>
        <button
          className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
