import { redirect } from "next/navigation";
import { getCurrentClinician } from "@/lib/auth/session";
import { PulseTrackLogo } from "@/app/ui/pulsetrack-logo";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (await getCurrentClinician()) {
    redirect("/dashboard");
  }

  return (
    <main className="login-backdrop login-shell relative flex items-center justify-center overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute left-[10%] top-[12%] hidden grid-cols-7 gap-4 opacity-35 lg:grid"
      >
        {Array.from({ length: 28 }, (_, index) => (
          <span
            className="h-1 w-1 rounded-full bg-[#55b9c0]"
            key={index}
          />
        ))}
      </div>
      <section className="login-card relative z-10 w-full max-w-[31rem] rounded-[1.75rem] border border-white/80 bg-white/95 shadow-[0_30px_80px_rgba(8,59,92,0.13)] backdrop-blur">
        <div className="text-center">
          <PulseTrackLogo className="justify-center" />
          <h1 className="login-heading text-3xl font-bold tracking-[-0.035em] text-[#073a5a] sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
            Sign in to access your clinic dashboard
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
