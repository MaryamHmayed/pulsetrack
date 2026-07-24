"use client";

import { useFormStatus } from "react-dom";
import { deletePatientAction } from "./actions";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Deleting…" : "Delete patient"}
    </button>
  );
}

export function DeletePatientButton({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const action = deletePatientAction.bind(null, patientId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Delete ${patientName}? This also removes their local assessments and lab results. This cannot be undone.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <DeleteButton />
    </form>
  );
}
