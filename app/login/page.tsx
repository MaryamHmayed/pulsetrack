import { redirect } from "next/navigation";
import { getCurrentClinician } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentClinician()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
            PulseTrack
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Clinician sign in
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Secure access to patient monitoring and assessment data.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
