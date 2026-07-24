import { dsma8 } from "@/lib/questionnaire/dsma8";
import { getPublicAssessmentState } from "@/lib/data/assessments";
import { QuestionnaireForm } from "./questionnaire-form";
import { ExpiredMarker } from "./expired-marker";

function UnavailableState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
      <p className="mt-3 leading-7 text-slate-600">{message}</p>
      <p className="mt-4 text-sm text-slate-500">
        Contact your clinic if you need help.
      </p>
    </div>
  );
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const assessment = await getPublicAssessmentState(token);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
            PulseTrack
          </p>
        </header>

        {assessment.kind === "ACTIVE" ? (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {dsma8.title}
              </h1>
              <p className="mt-3 leading-7 text-slate-600">
                {dsma8.instructions}
              </p>
              <p className="mt-4 text-sm text-slate-500">
                Your responses are shared with your care team. This form does
                not provide emergency medical care.
              </p>
            </div>
            <QuestionnaireForm token={token} />
          </>
        ) : assessment.kind === "COMPLETED" ? (
          <UnavailableState
            message="This link has already been submitted. Your previous responses have not been changed."
            title="Assessment already completed"
          />
        ) : assessment.kind === "EXPIRED" ? (
          <>
            <ExpiredMarker token={token} />
            <UnavailableState
              message="Assessment links expire after seven days. Ask your clinic to send a new link."
              title="Link expired"
            />
          </>
        ) : (
          <UnavailableState
            message="The link may be incomplete or no longer available."
            title="Invalid assessment link"
          />
        )}
      </div>
    </main>
  );
}
