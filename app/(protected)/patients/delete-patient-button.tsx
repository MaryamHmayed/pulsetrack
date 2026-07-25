"use client";

import { useFormStatus } from "react-dom";
import { deletePatientAction } from "./actions";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="button-danger min-h-10 px-4 py-2"
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
