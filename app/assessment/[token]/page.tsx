import { dsma8 } from "@/lib/questionnaire/dsma8";
import { getPublicAssessmentState } from "@/lib/data/assessments";
import { PulseTrackLogo } from "@/app/ui/pulsetrack-logo";
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
    <div className="app-card p-8 text-center">
      <h1 className="text-2xl font-bold text-[#073a5a]">{title}</h1>
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
    <main className="login-backdrop relative min-h-screen overflow-hidden px-4 py-8 sm:py-12">
      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="mb-8 flex justify-center">
          <PulseTrackLogo />
        </header>

        {assessment.kind === "ACTIVE" ? (
          <>
            <div className="app-card accent-top-teal mb-6 p-6 sm:p-8">
              <p className="app-eyebrow">Secure patient questionnaire</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#073a5a]">
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
